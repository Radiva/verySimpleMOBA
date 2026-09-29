/*
  ENGINE / CAMERA & MINIMAP
  =========================
  Alih-alih mengecilkan rasio seluruh peta supaya muat di layar, kanvas
  selalu berukuran tetap (Engine.layout.VIEWPORT_W/H — lihat
  data/config.js "viewport") dan kamera bergeser mengikuti hero pemain
  di dalam peta yang bisa jauh lebih besar (Engine.layout.CANVAS_W/H).

  Engine.state.camera menyimpan pojok kiri-atas area yang sedang
  terlihat, dalam koordinat peta. render.js menggeser konteks gambar
  (ctx.translate) sebesar ini sebelum menggambar dunia, lalu memanggil
  drawMinimap() di luar translate supaya minimap selalu di posisi tetap
  layar, tidak ikut bergeser bersama kamera.
*/
window.Engine = window.Engine || {};

(function(){
  "use strict";
  const E = window.Engine;

  function updateCamera(){
    const L=E.layout, s=E.state;
    const vw=L.VIEWPORT_W, vh=L.VIEWPORT_H;
    const hero = s.playerHero; // tetap fokus ke hero pemain (juga saat menunggu respawn)
    const focusX = hero ? hero.x : L.CANVAS_W/2;
    const focusY = hero ? hero.y : L.CANVAS_H/2;

    const camX = L.CANVAS_W<=vw ? (L.CANVAS_W-vw)/2 : E.util.clamp(focusX-vw/2, 0, L.CANVAS_W-vw);
    const camY = L.CANVAS_H<=vh ? (L.CANVAS_H-vh)/2 : E.util.clamp(focusY-vh/2, 0, L.CANVAS_H-vh);

    s.camera.x = camX;
    s.camera.y = camY;
  }

  function minimapRect(){
    const L=E.layout, CFG=L.CFG;
    const mmW = CFG.minimap.width;
    const mmH = mmW*(L.CANVAS_H/L.CANVAS_W);
    const margin = CFG.minimap.margin;
    let mx, my;
    switch(CFG.minimap.corner){
      case 'top-left':     mx=margin;                    my=margin; break;
      case 'top-right':    mx=L.VIEWPORT_W-mmW-margin;   my=margin; break;
      case 'bottom-right': mx=L.VIEWPORT_W-mmW-margin;   my=L.VIEWPORT_H-mmH-margin; break;
      default:              /* bottom-left */
                            mx=margin;                    my=L.VIEWPORT_H-mmH-margin; break;
    }
    return {mx,my,mmW,mmH};
  }

  function drawMinimap(){
    const ctx=E.ctx, L=E.layout, s=E.state;
    if(L.CFG.minimap.enabled===false) return;
    const {mx,my,mmW,mmH} = minimapRect();
    const scale = mmW/L.CANVAS_W;
    const dot=(x,y,r)=>{ ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); };

    ctx.save();

    ctx.fillStyle='rgba(18,22,15,0.85)';
    ctx.fillRect(mx,my,mmW,mmH);
    ctx.strokeStyle='rgba(201,155,74,0.6)';
    ctx.lineWidth=1;
    ctx.strokeRect(mx+0.5,my+0.5,mmW-1,mmH-1);

    // markas di kedua ujung
    ctx.fillStyle='rgba(63,127,176,0.85)';
    ctx.fillRect(mx, my, Math.max(2,L.BASE_W*scale), mmH);
    ctx.fillStyle='rgba(178,64,47,0.85)';
    ctx.fillRect(mx+mmW-Math.max(2,L.BASE_W*scale), my, Math.max(2,L.BASE_W*scale), mmH);

    // menara
    ctx.fillStyle='#5a9bd0';
    for(const t of s.playerTowers) if(t.hp>0) dot(mx+t.x*scale, my+t.y*scale, 1.6);
    ctx.fillStyle='#d0705a';
    for(const t of s.enemyTowers) if(t.hp>0) dot(mx+t.x*scale, my+t.y*scale, 1.6);

    // minion & monster hutan (titik kecil)
    ctx.fillStyle='#8fb8dc';
    for(const m of s.playerMinions) if(m.hp>0) dot(mx+m.x*scale, my+m.y*scale, 0.9);
    ctx.fillStyle='#e0917f';
    for(const m of s.enemyMinions) if(m.hp>0) dot(mx+m.x*scale, my+m.y*scale, 0.9);
    for(const m of s.jungleMonsters){ if(m.hp<=0) continue; ctx.fillStyle=m.color; dot(mx+m.x*scale, my+m.y*scale, 1.4); }

    // hero
    if(s.playerHero.hp>0){ ctx.fillStyle=s.playerHero.color; dot(mx+s.playerHero.x*scale, my+s.playerHero.y*scale, 2.6); }
    if(s.enemyHero.hp>0){ ctx.fillStyle=s.enemyHero.color; dot(mx+s.enemyHero.x*scale, my+s.enemyHero.y*scale, 2.6); }

    // kotak menandai area yang sedang terlihat di kamera
    ctx.strokeStyle='rgba(236,228,208,0.85)';
    ctx.lineWidth=1;
    ctx.strokeRect(
      mx+s.camera.x*scale, my+s.camera.y*scale,
      Math.min(L.VIEWPORT_W*scale, mmW), Math.min(L.VIEWPORT_H*scale, mmH)
    );

    ctx.restore();
  }

  window.Engine.Camera = { updateCamera, drawMinimap };
})();
