/*
  ENGINE / STATE & LAYOUT
  =======================
  Modul pertama yang harus dimuat di antara file js/engine/*.js.
  Menyiapkan namespace global `window.Engine` yang dipakai bersama oleh
  seluruh modul mesin (combat.js, movement.js, render.js, hud.js,
  input.js, core.js):

    Engine.layout   posisi/ukuran peta yang sudah dihitung dari
                    data/config.js (sekali saat halaman dimuat)
    Engine.util     fungsi bantu kecil (jarak, clamp, kebutuhan XP, dll)
    Engine.state    data pertandingan yang sedang berjalan (hero, minion,
                    menara, dst.) — berubah tiap frame
    Engine.canvas / Engine.ctx   elemen kanvas & konteks gambar 2D

  File-file lain HANYA membaca/menulis lewat Engine.* ini, tidak
  menyimpan variabel globalnya sendiri, supaya semua modul selalu
  melihat data yang sama.
*/
window.Engine = window.Engine || {};

(function(){
  "use strict";
  const CFG = window.GAME_CONFIG;
  const CANVAS_W = CFG.canvasW, CANVAS_H = CFG.canvasH;
  const pctPoint = p => ({ x: p.xPct*CANVAS_W, y: p.yPct*CANVAS_H });

  // Nexus (bangunan utama, menyerang seperti menara) & safe zone (zona aman di
  // belakang nexus) — nilai bawaan dipakai bila field-nya tidak ada di config.js
  const NEXUS_CFG = Object.assign({hp:CFG.baseHp||1500, dmg:45, range:130, atkInterval:1.1, radius:26}, CFG.nexus);
  const SAFE_CFG = Object.assign({widthPct:0.073, regenRate:25, protectHeroes:true}, CFG.safeZone);
  const WAVE_X = Object.assign({player:0.17, enemy:0.83}, CFG.waveSpawnXPct);

  const layout = {
    CFG, CANVAS_W, CANVAS_H,
    NEXUS: NEXUS_CFG, SAFE: SAFE_CFG,
    VIEWPORT_W: CFG.viewport.width,
    VIEWPORT_H: CFG.viewport.height,
    PLAYER_NEXUS: pctPoint(CFG.playerNexus || {xPct:0.125,yPct:0.5}),
    ENEMY_NEXUS: pctPoint(CFG.enemyNexus || {xPct:0.875,yPct:0.5}),
    PLAYER_SPAWN: pctPoint(CFG.playerSpawn),
    ENEMY_SPAWN: pctPoint(CFG.enemySpawn),
    LANE_TOP: CFG.laneBounds.topPct*CANVAS_H,
    LANE_BOTTOM: CFG.laneBounds.bottomPct*CANVAS_H,
    SAFE_W: SAFE_CFG.widthPct*CANVAS_W,
    WAVE_SPAWN_X: { player: WAVE_X.player*CANVAS_W, enemy: WAVE_X.enemy*CANVAS_W },
    WAVE_YS: CFG.waveYOffsetsPct.map(p=>p*CANVAS_H),
    PLAYER_TOWER_DEFS: CFG.towers.player.map(pctPoint),
    ENEMY_TOWER_DEFS: CFG.towers.enemy.map(pctPoint),
    RESOLVED_CAMPS: window.JUNGLE_CAMPS.map(c=>({...c, x:c.xPct*CANVAS_W, y:c.yPct*CANVAS_H}))
  };

  // Kanvas selalu berukuran VIEWPORT (jendela kamera), bukan ukuran
  // peta — peta boleh jauh lebih besar; kamera (js/engine/camera.js)
  // yang mengurus bagian mana dari peta yang sedang terlihat.
  const canvas = document.getElementById('field');
  canvas.width = layout.VIEWPORT_W;
  canvas.height = layout.VIEWPORT_H;

  const util = {
    dist: (a,b) => Math.hypot(a.x-b.x, a.y-b.y),
    clamp: (v,min,max) => Math.max(min, Math.min(max, v)),
    xpNeeded: (lvl) => CFG.xpPerLevelBase + lvl * CFG.xpPerLevelScale,
    effDmg: (u) => u.buffTimer>0 ? u.dmg*u.buffDmgMult : u.dmg,
    effSpeed: (u) => u.buffTimer>0 ? u.speed*u.buffSpeedMult : u.speed,
    effAtkInterval: (u) => u.buffTimer>0 ? u.atkInterval/u.buffAtkMult : u.atkInterval,
    // apakah unit berada di dalam safe zone timnya sendiri (jalur di tepi peta)
    inOwnSafeZone: (u) => u.team==='player' ? u.x<=layout.SAFE_W : u.x>=CANVAS_W-layout.SAFE_W,
    // putar sudut "cur" menuju "target" lewat jalur terpendek, maksimal maxStep radian
    turnToward: (cur,target,maxStep) => {
      const diff = Math.atan2(Math.sin(target-cur), Math.cos(target-cur));
      return Math.abs(diff)<=maxStep ? target : cur + Math.sign(diff)*maxStep;
    }
  };

  // Data pertandingan yang sedang berjalan.
  const state = {
    playerHero:null, enemyHero:null, playerMinions:[], enemyMinions:[],
    playerTowers:[], enemyTowers:[], playerBase:null, enemyBase:null,
    jungleMonsters:[], jungleRespawns:{},
    stats:null, waveTimer:0, waveCount:0,
    keys:{}, flashes:[], effects:[], lastTs:0,
    game:{state:'menu'}, rafId:null,
    camera:{x:0,y:0},
    playerTarget:null,   // target yang sedang dibidik hero pemain (untuk border merah)
    // preferensi target serangan pemain — diatur lewat 2 tombol di HUD
    // (lihat js/engine/hud.js): "type" menentukan urutan prioritas jenis
    // target (dimulai dari nilai ini, lalu berputar minion->hero->
    // building), "status" menentukan HP mana yang diutamakan dalam satu
    // jenis target yang sama ('lowest' atau 'highest').
    priority:Object.assign({type:'minion', status:'lowest'}, CFG.defaultPriority || {}),
    // dipakai saat pengguna sedang mengatur ulang tombol (lihat input.js)
    rebindingAction:null, rebindingCallback:null
  };

  window.Engine.canvas = canvas;
  window.Engine.ctx = canvas.getContext('2d');
  window.Engine.layout = layout;
  window.Engine.util = util;
  window.Engine.state = state;
})();
