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
      chip.innerHTML=
        '<div class="fill"></div>'+
        '<span class="ability-icon">'+(a.icon||'✦')+'</span>'+
        '<span class="skill-lvl-corner"></span>'+
        '<span class="key-corner"></span>'+
        '<span class="levelup-corner"></span>'+
        '<span class="cd-num"></span>'+
        '<span class="lock-overlay">🔒</span>';
      container.appendChild(chip);
    });
  }

  function updateAbilityChips(containerId,hero){
    const bindings = E.Input.getBindings();
    const isPlayerRow = containerId==='p-ability-row';
    hero.abilities.forEach((a,idx)=>{
      const chip=el(containerId+'-'+idx);
      if(!chip) return;
      const skillLvl = hero.skillLevels[idx];
      const maxLvl = E.Combat.getSkillMax(a);
      const learned = skillLvl>0;
      const remain=hero.abilityTimers[idx];
      const fill=chip.querySelector('.fill');
      const icon=chip.querySelector('.ability-icon');
      const keyCorner=chip.querySelector('.key-corner');
      const cdNum=chip.querySelector('.cd-num');
      const skillCorner=chip.querySelector('.skill-lvl-corner');
      const levelupCorner=chip.querySelector('.levelup-corner');
      const ready=remain<=0;

      chip.classList.toggle('ready', ready && learned);
      chip.classList.toggle('locked', !learned);
      fill.style.height = (ready||!learned) ? '0%' : ((remain/a.cooldown)*100)+'%';
      keyCorner.textContent = (bindings['ability'+(idx+1)]||'').toUpperCase();
      icon.style.opacity = (!learned) ? '0' : (ready ? '1' : '.35');
      cdNum.style.display = (ready||!learned) ? 'none' : 'flex';
      cdNum.textContent = (ready||!learned) ? '' : Math.ceil(remain);
      skillCorner.textContent = 'Lv '+skillLvl+'/'+maxLvl;

      if(isPlayerRow){
        const canLevel = E.Combat.canLevelUpSkill(hero, idx).ok;
        chip.classList.toggle('levelable', canLevel);
        levelupCorner.textContent = canLevel ? (bindings['skillUp'+(idx+1)]||'').toUpperCase() : '';
      }
    });
  }

  /* ---------------- Tombol prioritas serangan ---------------- */
  const TYPE_ORDER = ['minion','hero','building'];
  const TYPE_LABELS = {minion:'Minion', hero:'Hero', building:'Bangunan'};
  // urutan ganti: HP terendah -> HP tertinggi -> HP% terendah -> HP% tertinggi -> ...
  const STATUS_ORDER = ['lowest','highest','lowestPct','highestPct'];
  const STATUS_LABELS = {lowest:'HP Terendah', highest:'HP Tertinggi', lowestPct:'HP% Terendah', highestPct:'HP% Tertinggi'};

  function updatePriorityButtons(){
    const p=E.state.priority, b=E.Input.getBindings();
    const typeBtn=el('btn-priority-type');
    const statusBtn=el('btn-priority-status');
    if(typeBtn) typeBtn.textContent='Prioritas: '+TYPE_LABELS[p.type]+' ['+(b.priorityType||'').toUpperCase()+']';
    if(statusBtn) statusBtn.textContent='Fokus: '+STATUS_LABELS[p.status]+' ['+(b.priorityStatus||'').toUpperCase()+']';
  }

  // Urutan jenis target: minion -> hero -> building -> minion -> ...
  function cyclePriorityType(){
    const idx = TYPE_ORDER.indexOf(E.state.priority.type);
    E.state.priority.type = TYPE_ORDER[(idx+1)%TYPE_ORDER.length];
    updatePriorityButtons();
  }
  // Urutan status: HP terendah -> HP tertinggi -> HP% terendah -> HP% tertinggi
  function cyclePriorityStatus(){
    const idx = STATUS_ORDER.indexOf(E.state.priority.status);
    E.state.priority.status = STATUS_ORDER[(idx+1)%STATUS_ORDER.length];
    updatePriorityButtons();
  }

  // Sengaja tanpa handler klik: prioritas hanya diganti lewat shortcut keyboard
  // (lihat input.js), dan elemen di HUD hanya menjadi indikator.

  function updateHUD(){
    const s=E.state, CFG=E.layout.CFG;
    el('p-name').textContent=s.playerHero.name;
    el('p-lvl').textContent='Lv.'+s.playerHero.level;
    el('p-hp').style.width=Math.max(0,(s.playerHero.hp/s.playerHero.maxHp*100))+'%';
    el('e-name').textContent=s.enemyHero.name;
    el('e-lvl').textContent='Lv.'+s.enemyHero.level;
    el('e-hp').style.width=Math.max(0,(s.enemyHero.hp/s.enemyHero.maxHp*100))+'%';

    updateAbilityChips('p-ability-row',s.playerHero);
    updateAbilityChips('e-ability-row',s.enemyHero);
    updatePriorityButtons();

    const spTag=el('p-skillpoints');
    if(spTag){
      spTag.style.display = s.playerHero.skillPoints>0 ? 'inline-block' : 'none';
      spTag.textContent = s.playerHero.skillPoints+' Poin Skill — Z/X/C/V untuk memakai';
    }

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

    // timer respawn di panel info atas
    const rt=(h,id)=>{ const t=el(id); if(!t) return; t.style.display = h.hp<=0 ? 'inline-block' : 'none'; t.textContent='Bangkit dalam '+Math.ceil(h.respawnTimer)+'s'; };
    rt(s.playerHero,'p-respawn-tag'); rt(s.enemyHero,'e-respawn-tag');

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
        ? 'Nexus musuh berhasil dihancurkan.'
        : 'Nexus kita hancur diserbu musuh.';
      el('stat-kills').textContent = s.stats.playerKills+' - '+s.stats.enemyKills;
      el('stat-level').textContent = s.playerHero.level;
      el('stat-time').textContent = mm+':'+ss;
      el('overlay-over').classList.add('show');
    }
  }

  window.Engine.HUD = { buildAbilityUI, updateAbilityChips, updateHUD,
    updatePriorityButtons, cyclePriorityType, cyclePriorityStatus };
})();
