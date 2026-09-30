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

  // Semua koordinat peta (jalur, nexus, menara, safe zone, kemp hutan) ada
  // di data/mapshape.js — lihat file itu. Nilai bawaan di bawah cuma
  // penjaga (fallback) bila file itu tak dimuat / field-nya kosong.
  const SHAPE = window.MAP_SHAPE || {};
  const DEFAULT_PATH = [{xPct:0.1,yPct:0.5},{xPct:0.9,yPct:0.5}];

  // Jalur FUNGSIONAL (rute minion & koridor gerak hero) — terpisah dari
  // jalur VISUAL (pita yang digambar) di bawahnya. Lihat penjelasan
  // lengkap di data/mapshape.js.
  const MINION_PATH_PCT = (SHAPE.minionPath && SHAPE.minionPath.length>=2) ? SHAPE.minionPath : DEFAULT_PATH;
  const MINION_PATH = MINION_PATH_PCT.map(pctPoint);
  const MINION_PATH_SEG_LEN = [];
  let MINION_PATH_LENGTH = 0;
  for(let i=0;i<MINION_PATH.length-1;i++){
    const d = Math.hypot(MINION_PATH[i+1].x-MINION_PATH[i].x, MINION_PATH[i+1].y-MINION_PATH[i].y);
    MINION_PATH_SEG_LEN.push(d);
    MINION_PATH_LENGTH += d;
  }
  const LANE_WIDTH = (SHAPE.laneWidthPct||0.3) * CANVAS_H;
  const WAVE_LANE_OFFSETS = (CFG.waveLaneOffsetFractions||[0]).map(f=>f*(LANE_WIDTH/2));

  // Jalur VISUAL (murni tampilan, dipakai render.js & minimap) — boleh
  // berbeda bentuk dari jalur fungsional di atas. Bawaan: disamakan.
  const VISUAL_PATH_PCT = (SHAPE.visualPath && SHAPE.visualPath.length>=2) ? SHAPE.visualPath : MINION_PATH_PCT;
  const VISUAL_PATH = VISUAL_PATH_PCT.map(pctPoint);
  const VISUAL_WIDTH = (SHAPE.terrainWidthPct!==undefined ? SHAPE.terrainWidthPct : (SHAPE.laneWidthPct||0.3)) * CANVAS_H;

  // Nexus (bangunan utama, menyerang seperti menara) & safe zone (zona aman di
  // belakang nexus) — statistik/perilaku dari config.js, lebar/posisi dari mapshape.js
  const NEXUS_CFG = Object.assign({hp:CFG.baseHp||1500, dmg:45, range:130, atkInterval:1.1, radius:26}, CFG.nexus);
  const SAFE_CFG = Object.assign({widthPct:0.073, regenRate:25, protectHeroes:true}, CFG.safeZone,
    (SHAPE.safeZoneWidthPct!==undefined ? {widthPct:SHAPE.safeZoneWidthPct} : {}));

  const TOWERS = SHAPE.towers || {player:[], enemy:[]};

  const layout = {
    CFG, CANVAS_W, CANVAS_H,
    NEXUS: NEXUS_CFG, SAFE: SAFE_CFG,
    VIEWPORT_W: CFG.viewport.width,
    VIEWPORT_H: CFG.viewport.height,
    PLAYER_NEXUS: pctPoint(SHAPE.playerNexus || {xPct:0.125,yPct:0.5}),
    ENEMY_NEXUS: pctPoint(SHAPE.enemyNexus || {xPct:0.875,yPct:0.5}),
    PLAYER_SPAWN: pctPoint(CFG.playerSpawn),
    ENEMY_SPAWN: pctPoint(CFG.enemySpawn),
    SAFE_W: SAFE_CFG.widthPct*CANVAS_W,
    MINION_PATH, MINION_PATH_SEG_LEN, MINION_PATH_LENGTH, LANE_WIDTH, WAVE_LANE_OFFSETS,
    VISUAL_PATH, VISUAL_WIDTH,
    PLAYER_TOWER_DEFS: (TOWERS.player||[]).map(pctPoint),
    ENEMY_TOWER_DEFS: (TOWERS.enemy||[]).map(pctPoint),
    RESOLVED_CAMPS: (SHAPE.jungleCamps||[]).map(c=>({...c, x:c.xPct*CANVAS_W, y:c.yPct*CANVAS_H}))
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
    },
    // Titik di sepanjang jalur (data/mapshape.js) pada jarak tempuh tertentu
    // dari ujung awal (0) sampai ujung akhir (PATH_LENGTH), plus arah jalur
    // di titik itu (radian) — dipakai minion berjalan mengikuti bentuk jalur.
    pointAtPathDistance: (dist) => {
      const P=layout.MINION_PATH, SL=layout.MINION_PATH_SEG_LEN;
      dist = util.clamp(dist, 0, layout.MINION_PATH_LENGTH);
      let acc=0;
      for(let i=0;i<SL.length;i++){
        if(dist<=acc+SL[i] || i===SL.length-1){
          const t = SL[i]>0 ? Math.min(1,Math.max(0,(dist-acc)/SL[i])) : 0;
          const a=P[i], b=P[i+1];
          return { x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t, angle:Math.atan2(b.y-a.y,b.x-a.x) };
        }
        acc += SL[i];
      }
      const last=P[P.length-1]; return { x:last.x, y:last.y, angle:0 };
    },
    // Titik terdekat di jalur dari (x,y), beserta jaraknya ke jalur itu dan
    // posisi tempuhnya sepanjang jalur — dipakai untuk membatasi hero tetap
    // di dalam koridor jalur (clampToLane) walau jalurnya berkelok.
    closestOnPath: (x,y) => {
      const P=layout.MINION_PATH, SL=layout.MINION_PATH_SEG_LEN;
      let bestPt=P[0], bestD=Infinity, bestAlong=0, acc=0;
      for(let i=0;i<P.length-1;i++){
        const a=P[i], b=P[i+1];
        const abx=b.x-a.x, aby=b.y-a.y;
        const len2=abx*abx+aby*aby || 1;
        const t=Math.max(0,Math.min(1, ((x-a.x)*abx+(y-a.y)*aby)/len2));
        const px=a.x+abx*t, py=a.y+aby*t;
        const d=Math.hypot(x-px,y-py);
        if(d<bestD){ bestD=d; bestPt={x:px,y:py}; bestAlong=acc+t*SL[i]; }
        acc += SL[i];
      }
      return { x:bestPt.x, y:bestPt.y, dist:bestD, distAlong:bestAlong };
    },
    // Kalau (x,y) sudah di dalam koridor jalur (setengah LANE_WIDTH dari
    // jalur), kembalikan apa adanya; kalau keluar, tarik kembali tegak
    // lurus ke tepi koridor terdekat. Dipakai hero (pemain & AI) supaya
    // tidak bisa menembus luar jalur walau jalurnya berkelok.
    clampToLane: (x,y) => {
      const c = util.closestOnPath(x,y);
      const half = layout.LANE_WIDTH/2;
      if(c.dist<=half) return {x,y};
      const dx=x-c.x, dy=y-c.y, d=c.dist||1;
      return { x: c.x+dx/d*half, y: c.y+dy/d*half };
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
