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

  const layout = {
    CFG, CANVAS_W, CANVAS_H,
    PLAYER_BASE: pctPoint(CFG.playerBase),
    ENEMY_BASE: pctPoint(CFG.enemyBase),
    PLAYER_SPAWN: pctPoint(CFG.playerSpawn),
    ENEMY_SPAWN: pctPoint(CFG.enemySpawn),
    LANE_TOP: CFG.laneBounds.topPct*CANVAS_H,
    LANE_BOTTOM: CFG.laneBounds.bottomPct*CANVAS_H,
    BASE_W: CFG.baseWidthPct*CANVAS_W,
    WAVE_YS: CFG.waveYOffsetsPct.map(p=>p*CANVAS_H),
    PLAYER_TOWER_DEFS: CFG.towers.player.map(pctPoint),
    ENEMY_TOWER_DEFS: CFG.towers.enemy.map(pctPoint),
    RESOLVED_CAMPS: window.JUNGLE_CAMPS.map(c=>({...c, x:c.xPct*CANVAS_W, y:c.yPct*CANVAS_H}))
  };

  const canvas = document.getElementById('field');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  const util = {
    dist: (a,b) => Math.hypot(a.x-b.x, a.y-b.y),
    clamp: (v,min,max) => Math.max(min, Math.min(max, v)),
    xpNeeded: (lvl) => CFG.xpPerLevelBase + lvl * CFG.xpPerLevelScale,
    effDmg: (u) => u.buffTimer>0 ? u.dmg*u.buffDmgMult : u.dmg,
    effSpeed: (u) => u.buffTimer>0 ? u.speed*u.buffSpeedMult : u.speed,
    effAtkInterval: (u) => u.buffTimer>0 ? u.atkInterval/u.buffAtkMult : u.atkInterval
  };

  // Data pertandingan yang sedang berjalan.
  const state = {
    playerHero:null, enemyHero:null, playerMinions:[], enemyMinions:[],
    playerTowers:[], enemyTowers:[], playerBase:null, enemyBase:null,
    jungleMonsters:[], jungleRespawns:{},
    stats:null, waveTimer:0, waveCount:0,
    keys:{}, flashes:[], effects:[], lastTs:0,
    game:{state:'menu'}, rafId:null,
    // dipakai saat pengguna sedang mengatur ulang tombol (lihat input.js)
    rebindingAction:null, rebindingCallback:null
  };

  window.Engine.canvas = canvas;
  window.Engine.ctx = canvas.getContext('2d');
  window.Engine.layout = layout;
  window.Engine.util = util;
  window.Engine.state = state;
})();
