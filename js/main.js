/*
  ORKESTRASI MENU
  ===============
  - Membangun daftar hero (kolom kiri) dan panel detail (kolom kanan)
    dari data/heroes.js secara otomatis — menambah hero baru di
    data/heroes.js akan langsung muncul di sini tanpa mengubah file ini.
  - Membangun & mengatur modal "Atur Tombol" lewat API window.GameEngine
    (lihat js/engine/core.js & js/engine/input.js).
  - Mengatur transisi antar layar dan memanggil GameEngine.start(heroId).
*/
(function(){
  "use strict";
  const el = id=>document.getElementById(id);
  let selectedHeroId = null;

  function abilityTypeLabel(type){
    if(type==='aoe') return 'kerusakan area di sekitar hero';
    if(type==='snipe') return 'serangan jarak jauh ke musuh terdekat';
    if(type==='heal') return 'memulihkan HP sendiri';
    return type;
  }

  /* ---------------- Daftar hero (kiri) + detail (kanan) ---------------- */

  function buildHeroList(){
    const list=el('hero-list');
    list.innerHTML='';
    Object.entries(window.HERO_DEFS).forEach(([id,def])=>{
      const item=document.createElement('button');
      item.type='button';
      item.className='hero-list-item';
      item.dataset.id=id;
      item.innerHTML=
        '<div class="hero-list-badge" style="border-color:'+def.color+'">'+def.icon+'</div>'+
        '<div><div class="hero-list-name">'+def.name+'</div>'+
        '<div class="hero-list-title">'+def.title+'</div></div>';
      item.addEventListener('click',()=>selectHero(id));
      list.appendChild(item);
    });
  }

  function renderHeroDetail(id){
    const def=window.HERO_DEFS[id];
    const bindings=window.GameEngine.getKeyBindings();
    const abilitiesHtml = def.abilities.map((a,i)=>{
      const key=(bindings['ability'+(i+1)]||(i+1)).toString().toUpperCase();
      return '<div>'+(a.icon||'✦')+' [<b>'+key+'</b>] <b>'+a.name+'</b> — '+abilityTypeLabel(a.type)+'</div>';
    }).join('');
    const detail=el('hero-detail');
    detail.innerHTML=
      '<div class="hero-badge" style="border-color:'+def.color+'">'+def.icon+'</div>'+
      '<div class="hero-name">'+def.name+'</div>'+
      '<div class="hero-title">'+def.title+'</div>'+
      '<div class="hero-desc">'+def.desc+'</div>'+
      '<div class="hero-stats"><span>HP <b>'+def.maxHp+'</b></span><span>Jangkauan <b>'+def.range+'</b></span><span>Kecepatan <b>'+def.speed+'</b></span></div>'+
      '<div class="hero-abilities">'+abilitiesHtml+'</div>'+
      '<button class="btn" id="btn-pick-hero">Pilih Hero Ini</button>';
    el('btn-pick-hero').addEventListener('click',()=>startGame(id));
  }

  function selectHero(id){
    selectedHeroId=id;
    document.querySelectorAll('.hero-list-item').forEach(item=>{
      item.classList.toggle('active', item.dataset.id===id);
    });
    renderHeroDetail(id);
  }

  function startGame(heroId){
    el('screen-select').classList.add('hidden');
    el('screen-game').classList.add('active');
    window.GameEngine.start(heroId);
  }

  el('btn-restart').addEventListener('click',()=>{
    el('screen-game').classList.remove('active');
    el('screen-select').classList.remove('hidden');
  });

  /* ---------------- Modal "Atur Tombol" ---------------- */

  function renderKeybindList(){
    const container=el('keybind-list');
    const bindings=window.GameEngine.getKeyBindings();
    const labels=window.GameEngine.getKeyActionLabels();
    container.innerHTML=Object.keys(labels).map(action=>
      '<div class="keybind-row" data-action="'+action+'">'+
        '<span class="keybind-label">'+labels[action]+'</span>'+
        '<span class="keybind-key">'+bindings[action].toUpperCase()+'</span>'+
        '<button class="btn ghost small" data-action="'+action+'">Ubah</button>'+
      '</div>'
    ).join('');
    container.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const action=btn.dataset.action;
        const row=btn.closest('.keybind-row');
        row.querySelector('.keybind-key').textContent='Tekan tombol…';
        btn.disabled=true;
        window.GameEngine.beginKeyRebind(action, ()=>{
          renderKeybindList();
          if(selectedHeroId) renderHeroDetail(selectedHeroId);
        });
      });
    });
  }

  function openKeybinds(){
    renderKeybindList();
    el('overlay-keybinds').classList.add('show');
  }
  function closeKeybinds(){
    el('overlay-keybinds').classList.remove('show');
  }

  el('btn-open-keybinds').addEventListener('click', openKeybinds);
  el('btn-close-keys').addEventListener('click', closeKeybinds);
  el('btn-reset-keys').addEventListener('click',()=>{
    window.GameEngine.resetKeyBindings();
    renderKeybindList();
    if(selectedHeroId) renderHeroDetail(selectedHeroId);
  });

  /* ---------------- Inisialisasi ---------------- */
  buildHeroList();
  const firstId = Object.keys(window.HERO_DEFS)[0];
  if(firstId) selectHero(firstId);
})();
