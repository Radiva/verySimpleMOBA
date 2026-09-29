/*
  ENGINE / COMBAT
  ===============
  Semua yang berkaitan dengan siapa-menyerang-siapa, damage, XP, buff,
  dan pemakaian kemampuan hero. Diekspos lewat Engine.Combat.
*/
window.Engine = window.Engine || {};

(function(){
  "use strict";
  const E = window.Engine;

  function allTargets(){
    const s=E.state, arr=[];
    if(s.playerHero.hp>0) arr.push(s.playerHero);
    if(s.enemyHero.hp>0) arr.push(s.enemyHero);
    for(const m of s.playerMinions) if(m.hp>0) arr.push(m);
    for(const m of s.enemyMinions) if(m.hp>0) arr.push(m);
    for(const m of s.jungleMonsters) if(m.hp>0) arr.push(m);
    for(const t of s.playerTowers) if(t.hp>0) arr.push(t);
    for(const t of s.enemyTowers) if(t.hp>0) arr.push(t);
    if(s.playerBase.hp>0) arr.push(s.playerBase);
    if(s.enemyBase.hp>0) arr.push(s.enemyBase);
    return arr;
  }

  function nearestEnemyWithin(u,range){
    let best=null,bd=Infinity;
    for(const t of allTargets()){
      if(t.team===u.team) continue;
      const d=E.util.dist(u,t);
      if(d<=range && d<bd){bd=d;best=t;}
    }
    return best;
  }

  // Aturan siapa boleh menyerang siapa:
  //  - menara mengutamakan minion jika ada, baru hero (monster diabaikan)
  //  - minion jalur tidak pernah menyerang/diserang monster hutan
  //  - monster hutan hanya menyerang hero (bukan minion/menara)
  function candidateTargetsFor(u){
    let list = allTargets().filter(t=>t.team!==u.team && E.util.dist(u,t)<=u.range);
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
      if(minions.length) return minions.reduce((a,b)=> E.util.dist(u,a)<=E.util.dist(u,b)?a:b);
    }
    return candidates.reduce((a,b)=> E.util.dist(u,a)<=E.util.dist(u,b)?a:b);
  }

  // Target hero pemain memakai preferensi yang bisa diatur lewat 2
  // tombol di HUD (Engine.state.priority — lihat js/engine/hud.js):
  //   - "type"   : jenis target diutamakan lebih dulu, lalu berputar
  //                minion -> hero -> building -> minion.
  //   - "status" : di antara target sejenis, pilih HP 'lowest' atau
  //                'highest'. Jarak dipakai hanya sebagai pemecah seri.
  // Dipakai untuk serangan biasa hero pemain dan kemampuan bertipe
  // "snipe" miliknya — unit lain (musuh AI, minion, menara, monster)
  // tetap memakai findTargetFor() di atas (target terdekat).
  function categoryOf(t){
    if(t.type==='minion') return 'minion';
    if(t.type==='hero') return 'hero';
    if(t.type==='monster') return 'monster'; // selalu terakhir
    return 'building'; // menara atau markas
  }

  function pickTargetByPriority(u, range){
    const s=E.state;
    const candidates = allTargets().filter(t=>t.team!==u.team && E.util.dist(u,t)<=range);
    if(candidates.length===0) return null;
    const base=['minion','hero','building'];
    const startIdx=base.indexOf(s.priority.type);
    const order = base.slice(startIdx).concat(base.slice(0,startIdx)).concat('monster');
    for(const cat of order){
      const group = candidates.filter(t=>categoryOf(t)===cat);
      if(group.length){
        group.sort((a,b)=>{
          const diff = s.priority.status==='lowest' ? a.hp-b.hp : b.hp-a.hp;
          return diff!==0 ? diff : E.util.dist(u,a)-E.util.dist(u,b);
        });
        return group[0];
      }
    }
    return null;
  }

  function addFlash(source,target,strong){
    E.state.flashes.push({x1:source.x,y1:source.y,x2:target.x,y2:target.y,t:0.16,max:0.16,
      strong:!!strong, color:source.color||(source.team==='player'?'#3f7fb0':'#b2402f')});
  }

  function awardXP(hero,amt){
    const CFG=E.layout.CFG;
    if(!hero || hero.level>=CFG.heroMaxLevel) return;
    hero.xp += amt;
    while(hero.level<CFG.heroMaxLevel && hero.xp>=E.util.xpNeeded(hero.level)){
      hero.xp -= E.util.xpNeeded(hero.level);
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
    const s=E.state;
    if(target.hp<=0) return;
    target.hp = Math.max(0, target.hp-amount);
    addFlash(source,target);
    if(target.hp<=0){
      if(target.type==='hero'){
        const CFG=E.layout.CFG;
        target.respawnTimer = CFG.heroRespawnBase + target.level*CFG.heroRespawnPerLevel;
        if(source.team && source.team!==target.team){
          if(target.team==='player') s.stats.enemyKills++; else s.stats.playerKills++;
          const killer = source.type==='hero' ? source : (source.team==='player'?s.playerHero:s.enemyHero);
          awardXP(killer,100);
        }
      } else if(target.type==='minion'){
        const opposing = target.team==='player' ? s.enemyHero : s.playerHero;
        if(opposing.hp>0) awardXP(opposing,target.xpReward||15);
      } else if(target.type==='monster'){
        const killerHero = source.type==='hero' ? source : null;
        if(killerHero){
          awardXP(killerHero, target.xpReward);
          if(target.buff) applyBuff(killerHero, target.buff);
        }
        s.jungleRespawns[target.campId] = target.respawnTime;
      } else if(target.type==='base'){
        if(!s.game.over){
          s.game.over=true; s.game.state='over';
          s.game.winner = target.team==='player' ? 'enemy' : 'player';
        }
      }
    }
  }

  function performAutoAttacks(dt){
    const s=E.state;
    const attackers=[];
    if(s.playerHero.hp>0) attackers.push(s.playerHero);
    if(s.enemyHero.hp>0) attackers.push(s.enemyHero);
    for(const m of s.playerMinions) if(m.hp>0) attackers.push(m);
    for(const m of s.enemyMinions) if(m.hp>0) attackers.push(m);
    for(const m of s.jungleMonsters) if(m.hp>0) attackers.push(m);
    for(const t of s.playerTowers) if(t.hp>0) attackers.push(t);
    for(const t of s.enemyTowers) if(t.hp>0) attackers.push(t);

    for(const u of attackers){
      if(u.atkTimer>0){ u.atkTimer-=dt; continue; }
      const t = (u===s.playerHero) ? pickTargetByPriority(u,u.range) : findTargetFor(u);
      if(t){
        // hero menghadap target yang sedang diserang (panah arah ikut berputar)
        if(u.dir){
          const dx=t.x-u.x, dy=t.y-u.y, d=Math.hypot(dx,dy);
          if(d>0) u.dir={x:dx/d,y:dy/d};
        }
        dealDamage(u,t,E.util.effDmg(u)); u.atkTimer=E.util.effAtkInterval(u);
      }
    }
  }

  // Untuk menambah tipe kemampuan baru, tambahkan cabang "else if" baru
  // di sini dan gunakan ability.type sebagai penanda dari data/heroes.js.
  function useAbility(hero, abilityIndex){
    const a = hero.abilities[abilityIndex];
    if(!a || hero.hp<=0 || hero.abilityTimers[abilityIndex]>0) return false;
    const dmgMult = hero.buffTimer>0 ? hero.buffDmgMult : 1;

    if(a.type==='aoe'){
      const dmg=(a.baseDamage+hero.level*a.perLevel)*dmgMult;
      for(const t of allTargets()){
        if(t.team!==hero.team && t.type!=='base' && E.util.dist(hero,t)<=a.radius) dealDamage(hero,t,dmg);
      }
      E.state.effects.push({kind:'slam',x:hero.x,y:hero.y,t:0,dur:0.4,maxR:a.radius,color:hero.color});
    } else if(a.type==='snipe'){
      const target = hero===E.state.playerHero ? pickTargetByPriority(hero,a.radius) : nearestEnemyWithin(hero,a.radius);
      if(target){
        const dmg=(a.baseDamage+hero.level*a.perLevel)*dmgMult;
        dealDamage(hero,target,dmg);
        addFlash(hero,target,true);
      }
      E.state.effects.push({kind:'shot',x:hero.x,y:hero.y,t:0,dur:0.3,color:hero.color});
    } else if(a.type==='heal'){
      const amt=a.baseDamage+hero.level*a.perLevel;
      hero.hp=Math.min(hero.maxHp,hero.hp+amt);
      E.state.effects.push({kind:'heal',x:hero.x,y:hero.y,t:0,dur:0.4,color:hero.color});
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
        if(E.util.dist(hero,target)<=a.radius) useAbility(hero,idx);
      }
    });
  }

  window.Engine.Combat = {
    allTargets, nearestEnemyWithin, findTargetFor, pickTargetByPriority,
    dealDamage, awardXP, applyBuff, performAutoAttacks,
    useAbility, updateEnemyAbilities
  };
})();
