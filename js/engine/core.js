/*
  ENGINE / CORE
  =============
  Pembuatan entitas (hero, menara, monster hutan), reset pertandingan,
  loop utama (update + render tiap frame), dan API publik yang dipakai
  js/main.js: window.GameEngine.
*/
window.Engine = window.Engine || {};

(function(){
  "use strict";
  const E = window.Engine;

  function createHero(team,id,spawn){
    const def = window.HERO_DEFS[id];
    return {
      type:'hero', team, id, name:def.name, title:def.title, color:def.color, icon:def.icon,
      x:spawn.x, y:spawn.y, hp:def.maxHp, maxHp:def.maxHp, dmg:def.dmg,
      range:def.range, atkInterval:def.atkInterval, atkTimer:0, speed:def.speed,
      level:1, xp:0, abilities:def.abilities, abilityTimers:def.abilities.map(()=>0),
      respawnTimer:0, buffTimer:0, buffDmgMult:1, buffSpeedMult:1, buffAtkMult:1,
      dir:{x: team==='player'?1:-1, y:0}
    };
  }

  function makeTower(team,pos){
    const CFG=E.layout.CFG;
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
    const s=E.state, CFG=E.layout.CFG;
    const heroIds = Object.keys(window.HERO_DEFS);
    const enemyId = heroIds.find(id=>id!==selectedId) || selectedId;

    s.playerHero = createHero('player', selectedId, E.layout.PLAYER_SPAWN);
    s.enemyHero = createHero('enemy', enemyId, E.layout.ENEMY_SPAWN);
    s.playerMinions = []; s.enemyMinions = [];

    s.playerTowers = E.layout.PLAYER_TOWER_DEFS.map(pos=>makeTower('player',pos));
    s.enemyTowers = E.layout.ENEMY_TOWER_DEFS.map(pos=>makeTower('enemy',pos));
    s.playerBase = {type:'base',team:'player',x:E.layout.PLAYER_BASE.x,y:E.layout.PLAYER_BASE.y,hp:CFG.baseHp,maxHp:CFG.baseHp};
    s.enemyBase = {type:'base',team:'enemy',x:E.layout.ENEMY_BASE.x,y:E.layout.ENEMY_BASE.y,hp:CFG.baseHp,maxHp:CFG.baseHp};

    s.jungleMonsters = E.layout.RESOLVED_CAMPS.map(spawnCampMonster);
    s.jungleRespawns = {};

    s.stats = {playerKills:0, enemyKills:0, startTime:performance.now()};
    s.waveTimer = CFG.firstWaveDelay;
    s.waveCount = 0;
    s.keys = {};
    s.flashes = []; s.effects = [];
    s.game = {state:'playing', over:false, winner:null};
    document.getElementById('overlay-over').classList.remove('show');
    E.HUD.buildAbilityUI('p-ability-row', s.playerHero);
    E.Camera.updateCamera();
    s.lastTs = performance.now();
    cancelAnimationFrame(s.rafId);
    s.rafId = requestAnimationFrame(loop);
  }

  function updateAll(dt){
    const s=E.state, CFG=E.layout.CFG, M=E.Movement, C=E.Combat;
    s.waveTimer-=dt;
    if(s.waveTimer<=0){
      s.waveCount++;
      M.spawnWave('player',s.waveCount); M.spawnWave('enemy',s.waveCount);
      s.waveTimer=CFG.waveInterval;
    }
    M.updatePlayerMovement(dt);
    M.updateEnemyAI(dt);
    M.updateMinionsMovement(dt);
    C.performAutoAttacks(dt);
    M.updateAbilityTimers(dt);
    M.updateRespawns(dt);
    M.updateRegen(dt);
    M.updateBuffs(dt);
    M.updateJungleRespawns(dt);

    s.playerMinions=s.playerMinions.filter(m=>m.hp>0);
    s.enemyMinions=s.enemyMinions.filter(m=>m.hp>0);
    s.jungleMonsters=s.jungleMonsters.filter(m=>m.hp>0);

    s.flashes=s.flashes.filter(f=>{ f.t-=dt; return f.t>0; });
    s.effects=s.effects.filter(e=>{ e.t+=dt; return e.t<e.dur; });
  }

  function loop(ts){
    const s=E.state;
    const dt=Math.min((ts-s.lastTs)/1000,0.05);
    s.lastTs=ts;
    if(s.game.state==='playing'){
      updateAll(dt);
      E.Camera.updateCamera();
      E.Render.render();
      E.HUD.updateHUD();
      s.rafId=requestAnimationFrame(loop);
    } else {
      E.Render.render();
      E.HUD.updateHUD();
    }
  }

  window.Engine.Core = { createHero, makeTower, spawnCampMonster, resetGame };

  // API publik yang dipakai js/main.js
  window.GameEngine = {
    start: resetGame,
    getKeyBindings: () => E.Input.getBindings(),
    getKeyActionLabels: () => E.Input.getActionLabels(),
    setKeyBinding: (action,key) => E.Input.setBinding(action,key),
    resetKeyBindings: () => E.Input.resetBindings(),
    beginKeyRebind: (action,onDone) => E.Input.beginRebind(action,onDone)
  };
})();
