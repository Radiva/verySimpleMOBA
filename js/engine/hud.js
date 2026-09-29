/*
  ENGINE / HUD
  ============
  Sinkronisasi elemen DOM (panel HP/XP, chip kemampuan, layar akhir)
  dengan Engine.state tiap frame. Chip kemampuan menampilkan huruf
  tombol yang sedang dipakai (lewat Engine.Input.getBindings()) dan
  angka hitung mundur saat cooldown, bukan cuma efek glow.
*/
window.Engine = window.Engine || {};

(function(){
  "use strict";
  const E = window.Engine;
  const el = id=>document.getElementById(id);

  function buildAbilityUI(containerId, hero){
    const container = el(containerId);
    container.innerHTML='';
    hero.abilities.forEach((a,idx)=>{
      const chip=document.createElement('div');
      chip.className='ability-chip';
      chip.id=containerId+'-'+idx;
      chip.title=a.name;
      chip.innerHTML='<div class="fill"></div><span class="key-label"></span><span class="cd-num"></span>';
      container.appendChild(chip);
    });
  }

  function updateAbilityChips(containerId,hero){
    const bindings = E.Input.getBindings();
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
      keyLabel.textContent = (bindings['ability'+(idx+1)]||'').toUpperCase();
      keyLabel.style.display = ready ? 'block' : 'none';
      cdNum.style.display = ready ? 'none' : 'block';
      cdNum.textContent = ready ? '' : Math.ceil(remain);
    });
  }

  function updateHUD(){
    const s=E.state, CFG=E.layout.CFG;
    el('p-name').textContent=s.playerHero.name;
    el('p-lvl').textContent='Lv.'+s.playerHero.level;
    el('p-hp').style.width=Math.max(0,(s.playerHero.hp/s.playerHero.maxHp*100))+'%';
    el('e-name').textContent=s.enemyHero.name;
    el('e-lvl').textContent='Lv.'+s.enemyHero.level;
    el('e-hp').style.width=Math.max(0,(s.enemyHero.hp/s.enemyHero.maxHp*100))+'%';

    updateAbilityChips('p-ability-row',s.playerHero);

    const atMax = s.playerHero.level>=CFG.heroMaxLevel;
    el('p-xp-fill').style.width = atMax ? '100%' : Math.max(0,(s.playerHero.xp/E.util.xpNeeded(s.playerHero.level)*100))+'%';
    el('p-xp-text').textContent = atMax ? 'LEVEL MAKS' : s.playerHero.xp+' / '+E.util.xpNeeded(s.playerHero.level)+' XP';

    const eAtMax = s.enemyHero.level>=CFG.heroMaxLevel;
    el('e-xp-fill').style.width = eAtMax ? '100%' : Math.max(0,(s.enemyHero.xp/E.util.xpNeeded(s.enemyHero.level)*100))+'%';
    el('e-xp-text').textContent = eAtMax ? 'LEVEL MAKS' : s.enemyHero.xp+' / '+E.util.xpNeeded(s.enemyHero.level)+' XP';

    el('p-buff-tag').style.display = s.playerHero.buffTimer>0 ? 'inline-block' : 'none';
    el('p-buff-tag').textContent = 'BUFF '+Math.ceil(s.playerHero.buffTimer)+'s';
    el('e-buff-tag').style.display = s.enemyHero.buffTimer>0 ? 'inline-block' : 'none';
    el('e-buff-tag').textContent = 'BUFF '+Math.ceil(s.enemyHero.buffTimer)+'s';

    el('pb-hp').style.width=Math.max(0,(s.playerBase.hp/s.playerBase.maxHp*100))+'%';
    el('eb-hp').style.width=Math.max(0,(s.enemyBase.hp/s.enemyBase.maxHp*100))+'%';

    const elapsed=Math.floor((performance.now()-s.stats.startTime)/1000);
    const mm=String(Math.floor(elapsed/60)).padStart(2,'0');
    const ss=String(elapsed%60).padStart(2,'0');
    el('match-timer').textContent=mm+':'+ss;
    el('wave-timer').textContent='Gelombang berikut: '+Math.max(0,Math.ceil(s.waveTimer))+'d';

    if(s.game.state==='over'){
      el('over-title').textContent = s.game.winner==='player' ? 'MENANG!' : 'KALAH';
      el('over-sub').textContent = s.game.winner==='player'
        ? 'Markas musuh berhasil dihancurkan.'
        : 'Markas kita hancur diserbu musuh.';
      el('stat-kills').textContent = s.stats.playerKills+' - '+s.stats.enemyKills;
      el('stat-level').textContent = s.playerHero.level;
      el('stat-time').textContent = mm+':'+ss;
      el('overlay-over').classList.add('show');
    }
  }

  window.Engine.HUD = { buildAbilityUI, updateAbilityChips, updateHUD };
})();
