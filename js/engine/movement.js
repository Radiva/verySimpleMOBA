/*
  ENGINE / MOVEMENT & AI
  ======================
  Pergerakan hero pemain (baca input lewat Engine.Input), AI hero musuh,
  pergerakan minion, kemunculan gelombang (dengan pertumbuhan stat),
  respawn hutan/hero, dan regenerasi dekat markas.
*/
window.Engine = window.Engine || {};

(function(){
  "use strict";
  const E = window.Engine;

  function moveToward(unit,dest,dt){
    const dx=dest.x-unit.x, dy=dest.y-unit.y;
    const d=Math.hypot(dx,dy);
    if(d<1) return;
    const sp=E.util.effSpeed(unit);
    const CFG=E.layout.CFG;
    unit.x=E.util.clamp(unit.x+(dx/d)*sp*dt,CFG.heroClampMargin,E.layout.CANVAS_W-CFG.heroClampMargin);
    unit.y=E.util.clamp(unit.y+(dy/d)*sp*dt,E.layout.LANE_TOP,E.layout.LANE_BOTTOM);
  }

  function updatePlayerMovement(dt){
    const s=E.state, hero=s.playerHero, I=E.Input;
    if(hero.hp<=0) return;
    let dx=0,dy=0;
    if(I.isDown('up')) dy-=1;
    if(I.isDown('down')) dy+=1;
    if(I.isDown('left')) dx-=1;
    if(I.isDown('right')) dx+=1;
    if(dx||dy){
      const len=Math.hypot(dx,dy);
      const sp=E.util.effSpeed(hero);
      const CFG=E.layout.CFG;
      hero.x=E.util.clamp(hero.x+(dx/len)*sp*dt,CFG.heroClampMargin,E.layout.CANVAS_W-CFG.heroClampMargin);
      hero.y=E.util.clamp(hero.y+(dy/len)*sp*dt,E.layout.LANE_TOP,E.layout.LANE_BOTTOM);
    }
  }

  function updateEnemyAI(dt){
    const s=E.state, hero=s.enemyHero;
    if(hero.hp<=0) return;
    if(hero.hp < hero.maxHp*0.3 && E.util.dist(hero,E.layout.ENEMY_BASE)>40){
      moveToward(hero,E.layout.ENEMY_BASE,dt);
      E.Combat.updateEnemyAbilities(hero,null);
      return;
    }
    const target=E.Combat.nearestEnemyWithin(hero,260);
    if(target){
      const d=E.util.dist(hero,target);
      if(d>hero.range*0.85) moveToward(hero,target,dt);
    } else {
      moveToward(hero,{x:E.layout.PLAYER_BASE.x,y:hero.y},dt);
    }
    E.Combat.updateEnemyAbilities(hero,target);
  }

  function updateMinionsMovement(dt){
    const s=E.state, CFG=E.layout.CFG;
    for(const m of s.playerMinions){
      if(m.hp<=0) continue;
      if(E.Combat.findTargetFor(m)) continue;
      m.x=E.util.clamp(m.x+m.speed*dt,CFG.minionClampMargin,E.layout.CANVAS_W-CFG.minionClampMargin);
    }
    for(const m of s.enemyMinions){
      if(m.hp<=0) continue;
      if(E.Combat.findTargetFor(m)) continue;
      m.x=E.util.clamp(m.x-m.speed*dt,CFG.minionClampMargin,E.layout.CANVAS_W-CFG.minionClampMargin);
    }
  }

  function spawnWave(team,waveNumber){
    const s=E.state;
    const baseX = team==='player' ? 90 : 870;
    const list = team==='player' ? s.playerMinions : s.enemyMinions;
    const comp = window.WAVE_COMPOSITION;
    const growth = window.MINION_GROWTH || {hpPerWave:0,dmgPerWave:0,speedPerWave:0};
    const mult = Math.max(0, waveNumber-1);
    comp.forEach((typeId,i)=>{
      const def=window.MINION_DEFS[typeId];
      if(!def) return;
      const hp = def.hp + (growth.hpPerWave||0)*mult;
      list.push({type:'minion',team,x:baseX,y:E.layout.WAVE_YS[i%E.layout.WAVE_YS.length],hp,maxHp:hp,
        dmg:def.dmg+(growth.dmgPerWave||0)*mult,range:def.range,atkInterval:def.atkInterval,
        atkTimer:0, speed:def.speed+(growth.speedPerWave||0)*mult, xpReward:def.xpReward,
        color:def.color});
    });
  }

  function updateJungleRespawns(dt){
    const s=E.state;
    for(const campId of Object.keys(s.jungleRespawns)){
      s.jungleRespawns[campId]-=dt;
      if(s.jungleRespawns[campId]<=0){
        const camp=E.layout.RESOLVED_CAMPS.find(c=>c.id===campId);
        if(camp) s.jungleMonsters.push(E.Core.spawnCampMonster(camp));
        delete s.jungleRespawns[campId];
      }
    }
  }

  function updateRespawns(dt){
    const s=E.state;
    for(const hero of [s.playerHero,s.enemyHero]){
      if(hero.hp<=0){
        hero.respawnTimer-=dt;
        if(hero.respawnTimer<=0){
          hero.hp=hero.maxHp;
          const spawn = hero.team==='player' ? E.layout.PLAYER_SPAWN : E.layout.ENEMY_SPAWN;
          hero.x=spawn.x; hero.y=spawn.y;
        }
      }
    }
  }

  function updateRegen(dt){
    const s=E.state, CFG=E.layout.CFG;
    if(s.playerHero.hp>0 && E.util.dist(s.playerHero,E.layout.PLAYER_BASE)<CFG.baseRegenRadius)
      s.playerHero.hp=Math.min(s.playerHero.maxHp,s.playerHero.hp+CFG.baseRegenRate*dt);
    if(s.enemyHero.hp>0 && E.util.dist(s.enemyHero,E.layout.ENEMY_BASE)<CFG.baseRegenRadius)
      s.enemyHero.hp=Math.min(s.enemyHero.maxHp,s.enemyHero.hp+CFG.baseRegenRate*dt);
  }

  function updateBuffs(dt){
    for(const hero of [E.state.playerHero,E.state.enemyHero]){
      if(hero.buffTimer>0) hero.buffTimer=Math.max(0,hero.buffTimer-dt);
    }
  }

  function updateAbilityTimers(dt){
    for(const hero of [E.state.playerHero,E.state.enemyHero]){
      hero.abilityTimers = hero.abilityTimers.map(t=>Math.max(0,t-dt));
    }
  }

  window.Engine.Movement = {
    moveToward, updatePlayerMovement, updateEnemyAI, updateMinionsMovement,
    spawnWave, updateJungleRespawns, updateRespawns, updateRegen,
    updateBuffs, updateAbilityTimers
  };
})();
