/*
  MESIN GIM
  =========
  File ini membaca statistik dari data/config.js, data/heroes.js,
  data/minions.js, dan data/jungle.js. Biasanya kamu TIDAK perlu
  mengubah file ini hanya untuk menambah hero/minion/monster, mengubah
  angka balancing, atau mengubah layout peta — cukup edit file-file
  di folder data/.

  Ubah file ini hanya kalau ingin menambah mekanik baru, misalnya
  tipe kemampuan hero yang baru (lihat fungsi useAbility di bawah).
*/
(function(){
  "use strict";

  const CFG = window.GAME_CONFIG;
  const CANVAS_W = CFG.canvasW, CANVAS_H = CFG.canvasH;

  // --- Resolusi layout persentase -> piksel (dihitung sekali saat load) ---
  const pctPoint = p => ({ x: p.xPct*CANVAS_W, y: p.yPct*CANVAS_H });
  const PLAYER_BASE = pctPoint(CFG.playerBase);
  const ENEMY_BASE = pctPoint(CFG.enemyBase);
  const PLAYER_SPAWN = pctPoint(CFG.playerSpawn);
  const ENEMY_SPAWN = pctPoint(CFG.enemySpawn);
  const LANE_TOP = CFG.laneBounds.topPct*CANVAS_H;
  const LANE_BOTTOM = CFG.laneBounds.bottomPct*CANVAS_H;
  const BASE_W = CFG.baseWidthPct*CANVAS_W;
  const WAVE_YS = CFG.waveYOffsetsPct.map(p=>p*CANVAS_H);
  const PLAYER_TOWER_DEFS = CFG.towers.player.map(pctPoint);
  const ENEMY_TOWER_DEFS = CFG.towers.enemy.map(pctPoint);
  const RESOLVED_CAMPS = window.JUNGLE_CAMPS.map(c=>({...c, x:c.xPct*CANVAS_W, y:c.yPct*CANVAS_H}));

  const canvas = document.getElementById('field');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');

  const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
  const clamp = (v,min,max) => Math.max(min, Math.min(max, v));
  const xpNeeded = (lvl) => CFG.xpPerLevelBase + lvl * CFG.xpPerLevelScale;

  let playerHero, enemyHero, playerMinions, enemyMinions;
  let playerTowers, enemyTowers, playerBase, enemyBase;
  let jungleMonsters, jungleRespawns;
  let stats, waveTimer, waveCount, keys={}, flashes, effects, lastTs, game={state:'menu'}, rafId;

  /* ===================== SETUP ===================== */
  function createHero(team,id,spawn){
    const def = window.HERO_DEFS[id];
    return {
      type:'hero', team, id, name:def.name, title:def.title, color:def.color,
      x:spawn.x, y:spawn.y, hp:def.maxHp, maxHp:def.maxHp, dmg:def.dmg,
      range:def.range, atkInterval:def.atkInterval, atkTimer:0, speed:def.speed,
      level:1, xp:0, abilities:def.abilities, abilityTimers:def.abilities.map(()=>0),
      respawnTimer:0, buffTimer:0, buffDmgMult:1, buffSpeedMult:1, buffAtkMult:1
    };
  }

  function makeTower(team,pos){
    return {type:'tower',team,x:pos.x,y:pos.y,hp:CFG.towerHp,maxHp:CFG.towerHp,
      dmg:CFG.towerDmg,range:CFG.towerRange,atkInterval:CFG.towerAtkInterval,
      atkTimer:0,radius:20};
  }

  function spawnCampMonster(camp){
    const def = window.MONSTER_DEFS[camp.monster];
    return {
      type:'monster', team:'neutral', campId:camp.id, name:def.name,
      x:camp.x, y:camp.y, hp:def.hp, maxHp:def.hp, dmg:def.dmg,
      range:def.range, atkInterval:def.atkInterval, atkTimer:0,
      xpReward:def.xpReward, respawnTime:def.respawnTime||45,
      buff:def.buff||null, color:def.color
    };
  }

  function resetGame(selectedId){
    const heroIds = Object.keys(window.HERO_DEFS);
    const enemyId = heroIds.find(id=>id!==selectedId) || selectedId;

    playerHero = createHero('player', selectedId, PLAYER_SPAWN);
    enemyHero = createHero('enemy', enemyId, ENEMY_SPAWN);
    playerMinions = []; enemyMinions = [];

    playerTowers = PLAYER_TOWER_DEFS.map(pos=>makeTower('player',pos));
    enemyTowers = ENEMY_TOWER_DEFS.map(pos=>makeTower('enemy',pos));
    playerBase = {type:'base',team:'player',x:PLAYER_BASE.x,y:PLAYER_BASE.y,hp:CFG.baseHp,maxHp:CFG.baseHp};
    enemyBase = {type:'base',team:'enemy',x:ENEMY_BASE.x,y:ENEMY_BASE.y,hp:CFG.baseHp,maxHp:CFG.baseHp};

    jungleMonsters = RESOLVED_CAMPS.map(spawnCampMonster);
    jungleRespawns = {};

    stats = {playerKills:0, enemyKills:0, startTime:performance.now()};
    waveTimer = CFG.firstWaveDelay;
    waveCount = 0;
    keys = {};
    flashes = []; effects = [];
    game = {state:'playing', over:false, winner:null};
    document.getElementById('overlay-over').classList.remove('show');
    buildAbilityUI('p-ability-row', playerHero);
    lastTs = performance.now();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  /* ===================== EFEKTIF STAT (BUFF) ===================== */
  function effDmg(u){ return u.buffTimer>0 ? u.dmg*u.buffDmgMult : u.dmg; }
  function effSpeed(u){ return u.buffTimer>0 ? u.speed*u.buffSpeedMult : u.speed; }
  function effAtkInterval(u){ return u.buffTimer>0 ? u.atkInterval/u.buffAtkMult : u.atkInterval; }

  /* ===================== TARGETING ===================== */
  function allTargets(){
    const arr=[];
    if(playerHero.hp>0) arr.push(playerHero);
    if(enemyHero.hp>0) arr.push(enemyHero);
    for(const m of playerMinions) if(m.hp>0) arr.push(m);
    for(const m of enemyMinions) if(m.hp>0) arr.push(m);
    for(const m of jungleMonsters) if(m.hp>0) arr.push(m);
    for(const t of playerTowers) if(t.hp>0) arr.push(t);
    for(const t of enemyTowers) if(t.hp>0) arr.push(t);
    if(playerBase.hp>0) arr.push(playerBase);
    if(enemyBase.hp>0) arr.push(enemyBase);
    return arr;
  }

  function nearestEnemyWithin(u,range){
    let best=null,bd=Infinity;
    for(const t of allTargets()){
      if(t.team===u.team) continue;
      const d=dist(u,t);
      if(d<=range && d<bd){bd=d;best=t;}
    }
    return best;
  }

  // Aturan siapa boleh menyerang siapa:
  //  - menara mengutamakan minion jika ada, baru hero (monster diabaikan)
  //  - minion jalur tidak pernah menyerang/diserang monster hutan
  //  - monster hutan hanya menyerang hero (bukan minion/menara)
  function candidateTargetsFor(u){
    let list = allTargets().filter(t=>t.team!==u.team && dist(u,t)<=u.range);
    if(u.type==='tower') list = list.filter(t=>t.type!=='monster');
    if(u.type==='minion') list = list.filter(t=>t.type!=='monster');
    if(u.type==='monster') list = list.filter(t=>t.type==='hero');
    return list;
  }

  function findTargetFor(u){
    const candidates = candidateTargetsFor(u);
    if(candidates.length===0) return null;
    if(u.type==='tower'){
      const minions=candidates.filter(t=>t.type==='minion');
      if(minions.length) return minions.reduce((a,b)=> dist(u,a)<=dist(u,b)?a:b);
    }
    return candidates.reduce((a,b)=> dist(u,a)<=dist(u,b)?a:b);
  }

  /* ===================== COMBAT ===================== */
  function addFlash(source,target,strong){
    flashes.push({x1:source.x,y1:source.y,x2:target.x,y2:target.y,t:0.16,max:0.16,
      strong:!!strong, color:source.color||(source.team==='player'?'#3f7fb0':'#b2402f')});
  }

  function awardXP(hero,amt){
    if(!hero || hero.level>=CFG.heroMaxLevel) return;
    hero.xp += amt;
    while(hero.level<CFG.heroMaxLevel && hero.xp>=xpNeeded(hero.level)){
      hero.xp -= xpNeeded(hero.level);
      hero.level++;
      hero.maxHp += CFG.heroLevelHpGain; hero.hp=Math.min(hero.maxHp,hero.hp+CFG.heroLevelHpGain);
      hero.dmg += CFG.heroLevelDmgGain;
    }
    if(hero.level>=CFG.heroMaxLevel) hero.xp = 0;
  }

  function applyBuff(hero,buff){
    hero.buffTimer = buff.duration;
    hero.buffDmgMult = buff.damageMult||1;
    hero.buffSpeedMult = buff.speedMult||1;
    hero.buffAtkMult = buff.atkSpeedMult||1;
  }

  function dealDamage(source,target,amount){
    if(target.hp<=0) return;
    target.hp = Math.max(0, target.hp-amount);
    addFlash(source,target);
    if(target.hp<=0){
      if(target.type==='hero'){
        target.respawnTimer = CFG.heroRespawnBase + target.level*CFG.heroRespawnPerLevel;
        if(source.team && source.team!==target.team){
          if(target.team==='player') stats.enemyKills++; else stats.playerKills++;
          const killer = source.type==='hero' ? source : (source.team==='player'?playerHero:enemyHero);
          awardXP(killer,100);
        }
      } else if(target.type==='minion'){
        const opposing = target.team==='player' ? enemyHero : playerHero;
        if(opposing.hp>0) awardXP(opposing,target.xpReward||15);
      } else if(target.type==='monster'){
        const killerHero = source.type==='hero' ? source : null;
        if(killerHero){
          awardXP(killerHero, target.xpReward);
          if(target.buff) applyBuff(killerHero, target.buff);
        }
        jungleRespawns[target.campId] = target.respawnTime;
      } else if(target.type==='base'){
        if(!game.over){
          game.over=true; game.state='over';
          game.winner = target.team==='player' ? 'enemy' : 'player';
        }
      }
    }
  }

  function performAutoAttacks(dt){
    const attackers=[];
    if(playerHero.hp>0) attackers.push(playerHero);
    if(enemyHero.hp>0) attackers.push(enemyHero);
    for(const m of playerMinions) if(m.hp>0) attackers.push(m);
    for(const m of enemyMinions) if(m.hp>0) attackers.push(m);
    for(const m of jungleMonsters) if(m.hp>0) attackers.push(m);
    for(const t of playerTowers) if(t.hp>0) attackers.push(t);
    for(const t of enemyTowers) if(t.hp>0) attackers.push(t);

    for(const u of attackers){
      if(u.atkTimer>0){ u.atkTimer-=dt; continue; }
      const t=findTargetFor(u);
      if(t){ dealDamage(u,t,effDmg(u)); u.atkTimer=effAtkInterval(u); }
    }
  }

  // Untuk menambah tipe kemampuan baru, tambahkan cabang "else if"
  // baru di sini dan gunakan ability.type sebagai penanda dari
  // data/heroes.js. abilityIndex menunjuk ke abilities[abilityIndex]
  // dan abilityTimers[abilityIndex] milik hero tersebut.
  function useAbility(hero, abilityIndex){
    const a = hero.abilities[abilityIndex];
    if(!a || hero.hp<=0 || hero.abilityTimers[abilityIndex]>0) return false;
    const dmgMult = hero.buffTimer>0 ? hero.buffDmgMult : 1;

    if(a.type==='aoe'){
      const dmg=(a.baseDamage+hero.level*a.perLevel)*dmgMult;
      for(const t of allTargets()){
        if(t.team!==hero.team && t.type!=='base' && dist(hero,t)<=a.radius) dealDamage(hero,t,dmg);
      }
      effects.push({kind:'slam',x:hero.x,y:hero.y,t:0,dur:0.4,maxR:a.radius,color:hero.color});
    } else if(a.type==='snipe'){
      const target=nearestEnemyWithin(hero,a.radius);
      if(target){
        const dmg=(a.baseDamage+hero.level*a.perLevel)*dmgMult;
        dealDamage(hero,target,dmg);
        addFlash(hero,target,true);
      }
      effects.push({kind:'shot',x:hero.x,y:hero.y,t:0,dur:0.3,color:hero.color});
    } else if(a.type==='heal'){
      const amt=a.baseDamage+hero.level*a.perLevel;
      hero.hp=Math.min(hero.maxHp,hero.hp+amt);
      effects.push({kind:'heal',x:hero.x,y:hero.y,t:0,dur:0.4,color:hero.color});
    }
    hero.abilityTimers[abilityIndex]=a.cooldown;
    return true;
  }

  function updateEnemyAbilities(hero,target){
    hero.abilities.forEach((a,idx)=>{
      if(hero.abilityTimers[idx]>0) return;
      if(a.type==='heal'){
        if(hero.hp<hero.maxHp*0.7) useAbility(hero,idx);
      } else if(target && target.type==='hero' && a.radius){
        if(dist(hero,target)<=a.radius) useAbility(hero,idx);
      }
    });
  }

  /* ===================== MOVEMENT / AI ===================== */
  function moveToward(unit,dest,dt){
    const dx=dest.x-unit.x, dy=dest.y-unit.y;
    const d=Math.hypot(dx,dy);
    if(d<1) return;
    const sp=effSpeed(unit);
    unit.x=clamp(unit.x+(dx/d)*sp*dt,CFG.heroClampMargin,CANVAS_W-CFG.heroClampMargin);
    unit.y=clamp(unit.y+(dy/d)*sp*dt,LANE_TOP,LANE_BOTTOM);
  }

  function updatePlayerMovement(dt){
    if(playerHero.hp<=0) return;
    let dx=0,dy=0;
    if(keys['w']||keys['arrowup']) dy-=1;
    if(keys['s']||keys['arrowdown']) dy+=1;
    if(keys['a']||keys['arrowleft']) dx-=1;
    if(keys['d']||keys['arrowright']) dx+=1;
    if(dx||dy){
      const len=Math.hypot(dx,dy);
      const sp=effSpeed(playerHero);
      playerHero.x=clamp(playerHero.x+(dx/len)*sp*dt,CFG.heroClampMargin,CANVAS_W-CFG.heroClampMargin);
      playerHero.y=clamp(playerHero.y+(dy/len)*sp*dt,LANE_TOP,LANE_BOTTOM);
    }
  }

  function updateEnemyAI(dt){
    const hero=enemyHero;
    if(hero.hp<=0) return;
    if(hero.hp < hero.maxHp*0.3 && dist(hero,ENEMY_BASE)>40){
      moveToward(hero,ENEMY_BASE,dt);
      updateEnemyAbilities(hero,null);
      return;
    }
    const target=nearestEnemyWithin(hero,260);
    if(target){
      const d=dist(hero,target);
      if(d>hero.range*0.85) moveToward(hero,target,dt);
    } else {
      moveToward(hero,{x:PLAYER_BASE.x,y:hero.y},dt);
    }
    updateEnemyAbilities(hero,target);
  }

  function updateMinionsMovement(dt){
    for(const m of playerMinions){
      if(m.hp<=0) continue;
      if(findTargetFor(m)) continue;
      m.x=clamp(m.x+m.speed*dt,CFG.minionClampMargin,CANVAS_W-CFG.minionClampMargin);
    }
    for(const m of enemyMinions){
      if(m.hp<=0) continue;
      if(findTargetFor(m)) continue;
      m.x=clamp(m.x-m.speed*dt,CFG.minionClampMargin,CANVAS_W-CFG.minionClampMargin);
    }
  }

  function spawnWave(team,waveNumber){
    const baseX = team==='player' ? 90 : 870;
    const list = team==='player' ? playerMinions : enemyMinions;
    const comp = window.WAVE_COMPOSITION;
    const growth = window.MINION_GROWTH || {hpPerWave:0,dmgPerWave:0,speedPerWave:0};
    const mult = Math.max(0, waveNumber-1);
    comp.forEach((typeId,i)=>{
      const def=window.MINION_DEFS[typeId];
      if(!def) return;
      const hp = def.hp + (growth.hpPerWave||0)*mult;
      list.push({type:'minion',team,x:baseX,y:WAVE_YS[i%WAVE_YS.length],hp,maxHp:hp,
        dmg:def.dmg+(growth.dmgPerWave||0)*mult,range:def.range,atkInterval:def.atkInterval,
        atkTimer:0, speed:def.speed+(growth.speedPerWave||0)*mult, xpReward:def.xpReward,
        color:def.color});
    });
  }

  function updateJungleRespawns(dt){
    for(const campId of Object.keys(jungleRespawns)){
      jungleRespawns[campId]-=dt;
      if(jungleRespawns[campId]<=0){
        const camp=RESOLVED_CAMPS.find(c=>c.id===campId);
        if(camp) jungleMonsters.push(spawnCampMonster(camp));
        delete jungleRespawns[campId];
      }
    }
  }

  function updateRespawns(dt){
    for(const hero of [playerHero,enemyHero]){
      if(hero.hp<=0){
        hero.respawnTimer-=dt;
        if(hero.respawnTimer<=0){
          hero.hp=hero.maxHp;
          const spawn = hero.team==='player' ? PLAYER_SPAWN : ENEMY_SPAWN;
          hero.x=spawn.x; hero.y=spawn.y;
        }
      }
    }
  }

  function updateRegen(dt){
    if(playerHero.hp>0 && dist(playerHero,PLAYER_BASE)<CFG.baseRegenRadius)
      playerHero.hp=Math.min(playerHero.maxHp,playerHero.hp+CFG.baseRegenRate*dt);
    if(enemyHero.hp>0 && dist(enemyHero,ENEMY_BASE)<CFG.baseRegenRadius)
      enemyHero.hp=Math.min(enemyHero.maxHp,enemyHero.hp+CFG.baseRegenRate*dt);
  }

  function updateBuffs(dt){
    for(const hero of [playerHero,enemyHero]){
      if(hero.buffTimer>0) hero.buffTimer=Math.max(0,hero.buffTimer-dt);
    }
  }

  function updateAbilityTimers(dt){
    for(const hero of [playerHero,enemyHero]){
      hero.abilityTimers = hero.abilityTimers.map(t=>Math.max(0,t-dt));
    }
  }

  /* ===================== LOOP UTAMA ===================== */
  function updateAll(dt){
    waveTimer-=dt;
    if(waveTimer<=0){
      waveCount++;
      spawnWave('player',waveCount); spawnWave('enemy',waveCount);
      waveTimer=CFG.waveInterval;
    }
    updatePlayerMovement(dt);
    updateEnemyAI(dt);
    updateMinionsMovement(dt);
    performAutoAttacks(dt);
    updateAbilityTimers(dt);
    updateRespawns(dt);
    updateRegen(dt);
    updateBuffs(dt);
    updateJungleRespawns(dt);

    playerMinions=playerMinions.filter(m=>m.hp>0);
    enemyMinions=enemyMinions.filter(m=>m.hp>0);
    jungleMonsters=jungleMonsters.filter(m=>m.hp>0);

    flashes=flashes.filter(f=>{ f.t-=dt; return f.t>0; });
    effects=effects.filter(e=>{ e.t+=dt; return e.t<e.dur; });
  }

  /* ===================== RENDER ===================== */
  function drawBg(){
    ctx.fillStyle='#1a2015';
    ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const grd=ctx.createLinearGradient(0,0,0,CANVAS_H);
    grd.addColorStop(0,'#242d1c');
    grd.addColorStop(0.5,'#2c3722');
    grd.addColorStop(1,'#242d1c');
    ctx.fillStyle=grd;
    ctx.fillRect(0,LANE_TOP,CANVAS_W,LANE_BOTTOM-LANE_TOP);
    ctx.strokeStyle='rgba(201,155,74,0.14)';
    ctx.lineWidth=1;
    for(let x=0;x<CANVAS_W;x+=40){
      ctx.beginPath(); ctx.moveTo(x,LANE_TOP); ctx.lineTo(x,LANE_BOTTOM); ctx.stroke();
    }
  }

  function drawBase(base,isPlayer){
    const w=BASE_W,h=CANVAS_H;
    const x = isPlayer ? 0 : CANVAS_W-w;
    const alive = base.hp>0;
    ctx.fillStyle = isPlayer ? 'rgba(63,127,176,0.28)' : 'rgba(178,64,47,0.28)';
    ctx.fillRect(x,0,w,h);
    ctx.strokeStyle = isPlayer ? '#3f7fb0' : '#b2402f';
    ctx.lineWidth=2;
    ctx.strokeRect(x+2,2,w-4,h-4);
    ctx.fillStyle= alive ? '#ece4d0' : '#665f4f';
    ctx.font="700 12px 'Rajdhani', sans-serif";
    ctx.textAlign='center';
    ctx.fillText('MARKAS', x+w/2, base.y-40);
    drawHpBar(x+w/2-28,base.y-30,56,6,base.hp,base.maxHp);
  }

  function drawTower(t){
    const alive=t.hp>0;
    ctx.beginPath();
    ctx.arc(t.x,t.y,t.radius,0,Math.PI*2);
    ctx.fillStyle = alive ? (t.team==='player'?'#2b4f6e':'#6e2b23') : '#333';
    ctx.fill();
    ctx.lineWidth=3;
    ctx.strokeStyle = alive ? (t.team==='player'?'#3f7fb0':'#b2402f') : '#555';
    ctx.stroke();
    if(alive){
      ctx.beginPath();
      ctx.moveTo(t.x,t.y-t.radius-2);
      ctx.lineTo(t.x+10,t.y-t.radius-12);
      ctx.lineTo(t.x,t.y-t.radius-22);
      ctx.fillStyle = t.team==='player' ? '#3f7fb0' : '#b2402f';
      ctx.fill();
      drawHpBar(t.x-24,t.y-t.radius-34,48,5,t.hp,t.maxHp);
    }
  }

  function drawHpBar(x,y,w,h,hp,maxHp){
    const pct=Math.max(0,hp/maxHp);
    ctx.fillStyle='rgba(0,0,0,0.55)';
    ctx.fillRect(x,y,w,h);
    ctx.fillStyle = pct>0.5?'#7ea25a':(pct>0.25?'#c9a13a':'#b2402f');
    ctx.fillRect(x,y,w*pct,h);
    ctx.strokeStyle='rgba(0,0,0,0.6)';
    ctx.strokeRect(x,y,w,h);
  }

  function drawMinion(m){
    ctx.beginPath();
    ctx.arc(m.x,m.y,8,0,Math.PI*2);
    ctx.fillStyle = m.team==='player' ? (m.color||'#6fa0c4') : '#c46a5c';
    ctx.fill();
    ctx.strokeStyle='#00000055';
    ctx.stroke();
    drawHpBar(m.x-12,m.y-18,24,4,m.hp,m.maxHp);
  }

  function drawMonster(m){
    // belah ketupat agar mudah dibedakan dari minion (lingkaran) dan hero
    const r=11;
    ctx.beginPath();
    ctx.moveTo(m.x,m.y-r);
    ctx.lineTo(m.x+r,m.y);
    ctx.lineTo(m.x,m.y+r);
    ctx.lineTo(m.x-r,m.y);
    ctx.closePath();
    ctx.fillStyle=m.color;
    ctx.fill();
    ctx.strokeStyle='#00000066';
    ctx.lineWidth=2;
    ctx.stroke();
    drawHpBar(m.x-14,m.y-r-10,28,4,m.hp,m.maxHp);
  }

  function drawJungleRespawnMarkers(){
    ctx.font="10px 'Work Sans'";
    ctx.textAlign='center';
    ctx.fillStyle='#ffffff77';
    for(const campId of Object.keys(jungleRespawns)){
      const camp=RESOLVED_CAMPS.find(c=>c.id===campId);
      if(!camp) continue;
      ctx.beginPath();
      ctx.arc(camp.x,camp.y,9,0,Math.PI*2);
      ctx.strokeStyle='#ffffff33';
      ctx.stroke();
      ctx.fillText(Math.ceil(jungleRespawns[campId])+'s', camp.x, camp.y+3);
    }
  }

  function drawHero(h){
    if(h.hp<=0){
      ctx.font="600 12px 'Work Sans'";
      ctx.fillStyle='#ffffff99';
      ctx.textAlign='center';
      ctx.fillText((h.team==='player'?'Bangkit ':'Musuh bangkit ')+Math.ceil(h.respawnTimer)+'s',
        h.team==='player'?PLAYER_SPAWN.x:ENEMY_SPAWN.x, (LANE_TOP+LANE_BOTTOM)/2-20);
      return;
    }
    if(h.buffTimer>0){
      ctx.beginPath();
      ctx.arc(h.x,h.y,20,0,Math.PI*2);
      ctx.strokeStyle='#e4b662aa';
      ctx.lineWidth=2;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(h.x,h.y,15,0,Math.PI*2);
    ctx.fillStyle=h.color;
    ctx.fill();
    ctx.lineWidth=3;
    ctx.strokeStyle = h.team==='player' ? '#3f7fb0' : '#b2402f';
    ctx.stroke();
    ctx.font="600 11px 'Rajdhani', sans-serif";
    ctx.fillStyle='#ece4d0';
    ctx.textAlign='center';
    ctx.fillText(h.name+' Lv'+h.level, h.x, h.y-24);
    drawHpBar(h.x-20,h.y-20,40,5,h.hp,h.maxHp);
  }

  function drawFlashes(){
    for(const f of flashes){
      const a=f.t/f.max;
      ctx.strokeStyle = f.color+Math.round(a*200+40).toString(16).padStart(2,'0');
      ctx.lineWidth = f.strong?3:1.5;
      ctx.beginPath();
      ctx.moveTo(f.x1,f.y1);
      ctx.lineTo(f.x2,f.y2);
      ctx.stroke();
    }
  }

  function drawEffects(){
    for(const e of effects){
      const p=e.t/e.dur;
      if(e.kind==='slam'){
        ctx.beginPath();
        ctx.arc(e.x,e.y,e.maxR*p,0,Math.PI*2);
        ctx.strokeStyle=e.color+Math.round((1-p)*180).toString(16).padStart(2,'0');
        ctx.lineWidth=4;
        ctx.stroke();
      } else if(e.kind==='shot'){
        ctx.beginPath();
        ctx.arc(e.x,e.y,10+p*14,0,Math.PI*2);
        ctx.strokeStyle=e.color+Math.round((1-p)*200).toString(16).padStart(2,'0');
        ctx.lineWidth=2;
        ctx.stroke();
      } else if(e.kind==='heal'){
        ctx.beginPath();
        ctx.arc(e.x,e.y,14+p*10,0,Math.PI*2);
        ctx.strokeStyle='#7ea25a'+Math.round((1-p)*200).toString(16).padStart(2,'0');
        ctx.lineWidth=2;
        ctx.stroke();
      }
    }
  }

  function render(){
    drawBg();
    drawBase(playerBase,true);
    drawBase(enemyBase,false);
    for(const t of playerTowers) drawTower(t);
    for(const t of enemyTowers) drawTower(t);
    for(const m of playerMinions) drawMinion(m);
    for(const m of enemyMinions) drawMinion(m);
    for(const m of jungleMonsters) drawMonster(m);
    drawJungleRespawnMarkers();
    drawHero(playerHero);
    drawHero(enemyHero);
    drawFlashes();
    drawEffects();
  }

  /* ===================== HUD ===================== */
  const el = id=>document.getElementById(id);

  // Membangun ulang chip kemampuan (jumlahnya menyesuaikan hero yang
  // dipilih) — dipanggil sekali tiap kali sebuah game dimulai.
  function buildAbilityUI(containerId, hero){
    const container = el(containerId);
    container.innerHTML='';
    hero.abilities.forEach((a,idx)=>{
      const chip=document.createElement('div');
      chip.className='ability-chip';
      chip.id=containerId+'-'+idx;
      chip.title=a.name;
      chip.innerHTML='<div class="fill"></div><span class="key-label">'+(idx+1)+'</span><span class="cd-num"></span>';
      container.appendChild(chip);
    });
  }

  function updateAbilityChips(containerId,hero){
    hero.abilities.forEach((a,idx)=>{
      const chip=el(containerId+'-'+idx);
      if(!chip) return;
      const remain=hero.abilityTimers[idx];
      const fill=chip.querySelector('.fill');
      const keyLabel=chip.querySelector('.key-label');
      const cdNum=chip.querySelector('.cd-num');
      const ready=remain<=0;
      chip.classList.toggle('ready',ready);
      fill.style.height = ready ? '0%' : ((remain/a.cooldown)*100)+'%';
      keyLabel.style.display = ready ? 'block' : 'none';
      cdNum.style.display = ready ? 'none' : 'block';
      cdNum.textContent = ready ? '' : Math.ceil(remain);
    });
  }

  function updateHUD(){
    el('p-name').textContent=playerHero.name;
    el('p-lvl').textContent='Lv.'+playerHero.level;
    el('p-hp').style.width=Math.max(0,(playerHero.hp/playerHero.maxHp*100))+'%';
    el('e-name').textContent=enemyHero.name;
    el('e-lvl').textContent='Lv.'+enemyHero.level;
    el('e-hp').style.width=Math.max(0,(enemyHero.hp/enemyHero.maxHp*100))+'%';

    updateAbilityChips('p-ability-row',playerHero);

    const atMax = playerHero.level>=CFG.heroMaxLevel;
    el('p-xp-fill').style.width = atMax ? '100%' : Math.max(0,(playerHero.xp/xpNeeded(playerHero.level)*100))+'%';
    el('p-xp-text').textContent = atMax ? 'LEVEL MAKS' : playerHero.xp+' / '+xpNeeded(playerHero.level)+' XP';

    const eAtMax = enemyHero.level>=CFG.heroMaxLevel;
    el('e-xp-fill').style.width = eAtMax ? '100%' : Math.max(0,(enemyHero.xp/xpNeeded(enemyHero.level)*100))+'%';
    el('e-xp-text').textContent = eAtMax ? 'LEVEL MAKS' : enemyHero.xp+' / '+xpNeeded(enemyHero.level)+' XP';

    el('p-buff-tag').style.display = playerHero.buffTimer>0 ? 'inline-block' : 'none';
    el('p-buff-tag').textContent = 'BUFF '+Math.ceil(playerHero.buffTimer)+'s';
    el('e-buff-tag').style.display = enemyHero.buffTimer>0 ? 'inline-block' : 'none';
    el('e-buff-tag').textContent = 'BUFF '+Math.ceil(enemyHero.buffTimer)+'s';

    el('pb-hp').style.width=Math.max(0,(playerBase.hp/playerBase.maxHp*100))+'%';
    el('eb-hp').style.width=Math.max(0,(enemyBase.hp/enemyBase.maxHp*100))+'%';

    const elapsed=Math.floor((performance.now()-stats.startTime)/1000);
    const mm=String(Math.floor(elapsed/60)).padStart(2,'0');
    const ss=String(elapsed%60).padStart(2,'0');
    el('match-timer').textContent=mm+':'+ss;
    el('wave-timer').textContent='Gelombang berikut: '+Math.max(0,Math.ceil(waveTimer))+'d';

    if(game.state==='over'){
      el('over-title').textContent = game.winner==='player' ? 'MENANG!' : 'KALAH';
      el('over-sub').textContent = game.winner==='player'
        ? 'Markas musuh berhasil dihancurkan.'
        : 'Markas kita hancur diserbu musuh.';
      el('stat-kills').textContent = stats.playerKills+' - '+stats.enemyKills;
      el('stat-level').textContent = playerHero.level;
      el('stat-time').textContent = mm+':'+ss;
      el('overlay-over').classList.add('show');
    }
  }

  function loop(ts){
    const dt=Math.min((ts-lastTs)/1000,0.05);
    lastTs=ts;
    if(game.state==='playing'){
      updateAll(dt);
      render();
      updateHUD();
      rafId=requestAnimationFrame(loop);
    } else {
      render();
      updateHUD();
    }
  }

  /* ===================== INPUT ===================== */
  // Tombol kemampuan: 1, 2, 3, 4 -> abilities[0..3] milik hero pemain.
  window.addEventListener('keydown',e=>{
    keys[e.key.toLowerCase()]=true;
    const num = parseInt(e.key,10);
    if(num>=1 && num<=4){
      if(game && game.state==='playing') useAbility(playerHero, num-1);
    }
  });
  window.addEventListener('keyup',e=>{ keys[e.key.toLowerCase()]=false; });

  /* ===================== API PUBLIK ===================== */
  window.GameEngine = {
    start: resetGame
  };
})();
