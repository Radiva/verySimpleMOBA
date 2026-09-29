/*
  ENGINE / RENDER
  ===============
  Semua fungsi menggambar ke kanvas (Engine.ctx), dibaca dari data di
  Engine.state & Engine.layout. Tidak mengubah state apa pun.
*/
window.Engine = window.Engine || {};

(function(){
  "use strict";
  const E = window.Engine;

  function drawBg(){
    const ctx=E.ctx, L=E.layout;
    ctx.fillStyle='#1a2015';
    ctx.fillRect(0,0,L.CANVAS_W,L.CANVAS_H);
    const grd=ctx.createLinearGradient(0,0,0,L.CANVAS_H);
    grd.addColorStop(0,'#242d1c');
    grd.addColorStop(0.5,'#2c3722');
    grd.addColorStop(1,'#242d1c');
    ctx.fillStyle=grd;
    ctx.fillRect(0,L.LANE_TOP,L.CANVAS_W,L.LANE_BOTTOM-L.LANE_TOP);
    ctx.strokeStyle='rgba(201,155,74,0.14)';
    ctx.lineWidth=1;
    for(let x=0;x<L.CANVAS_W;x+=40){
      ctx.beginPath(); ctx.moveTo(x,L.LANE_TOP); ctx.lineTo(x,L.LANE_BOTTOM); ctx.stroke();
    }
  }

  function drawHpBar(x,y,w,h,hp,maxHp){
    const ctx=E.ctx;
    const pct=Math.max(0,hp/maxHp);
    ctx.fillStyle='rgba(0,0,0,0.55)';
    ctx.fillRect(x,y,w,h);
    ctx.fillStyle = pct>0.5?'#7ea25a':(pct>0.25?'#c9a13a':'#b2402f');
    ctx.fillRect(x,y,w*pct,h);
    ctx.strokeStyle='rgba(0,0,0,0.6)';
    ctx.strokeRect(x,y,w,h);
  }

  function drawBase(base,isPlayer){
    const ctx=E.ctx, L=E.layout;
    const w=L.BASE_W,h=L.CANVAS_H;
    const x = isPlayer ? 0 : L.CANVAS_W-w;
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
    const ctx=E.ctx;
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

  function drawMinion(m){
    const ctx=E.ctx;
    ctx.beginPath();
    ctx.arc(m.x,m.y,8,0,Math.PI*2);
    ctx.fillStyle = m.team==='player' ? (m.color||'#6fa0c4') : '#c46a5c';
    ctx.fill();
    ctx.strokeStyle='#00000055';
    ctx.stroke();
    drawHpBar(m.x-12,m.y-18,24,4,m.hp,m.maxHp);
  }

  function drawMonster(m){
    const ctx=E.ctx, r=11;
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
    const ctx=E.ctx, s=E.state;
    ctx.font="10px 'Work Sans'";
    ctx.textAlign='center';
    ctx.fillStyle='#ffffff77';
    for(const campId of Object.keys(s.jungleRespawns)){
      const camp=E.layout.RESOLVED_CAMPS.find(c=>c.id===campId);
      if(!camp) continue;
      ctx.beginPath();
      ctx.arc(camp.x,camp.y,9,0,Math.PI*2);
      ctx.strokeStyle='#ffffff33';
      ctx.stroke();
      ctx.fillText(Math.ceil(s.jungleRespawns[campId])+'s', camp.x, camp.y+3);
    }
  }

  function drawHero(h){
    const ctx=E.ctx, L=E.layout;
    if(h.hp<=0){
      ctx.font="600 12px 'Work Sans'";
      ctx.fillStyle='#ffffff99';
      ctx.textAlign='center';
      const spawn = h.team==='player' ? L.PLAYER_SPAWN : L.ENEMY_SPAWN;
      ctx.fillText((h.team==='player'?'Bangkit ':'Musuh bangkit ')+Math.ceil(h.respawnTimer)+'s',
        spawn.x, (L.LANE_TOP+L.LANE_BOTTOM)/2-20);
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
    const ctx=E.ctx;
    for(const f of E.state.flashes){
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
    const ctx=E.ctx;
    for(const e of E.state.effects){
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
    const s=E.state;
    drawBg();
    drawBase(s.playerBase,true);
    drawBase(s.enemyBase,false);
    for(const t of s.playerTowers) drawTower(t);
    for(const t of s.enemyTowers) drawTower(t);
    for(const m of s.playerMinions) drawMinion(m);
    for(const m of s.enemyMinions) drawMinion(m);
    for(const m of s.jungleMonsters) drawMonster(m);
    drawJungleRespawnMarkers();
    drawHero(s.playerHero);
    drawHero(s.enemyHero);
    drawFlashes();
    drawEffects();
  }

  window.Engine.Render = { render };
})();
