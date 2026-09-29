/*
  ORKESTRASI MENU
  ===============
  Membangun kartu pilihan hero dari data/heroes.js secara otomatis
  (jadi menambah hero baru di data/heroes.js akan langsung muncul di
  layar pemilihan tanpa perlu mengubah file ini), lalu mengatur
  transisi antar layar dan memanggil GameEngine.start(heroId).
*/
(function(){
  "use strict";
  const el = id=>document.getElementById(id);

  function abilityTypeLabel(type){
    if(type==='aoe') return 'kerusakan area di sekitar hero';
    if(type==='snipe') return 'serangan jarak jauh ke musuh terdekat';
    if(type==='heal') return 'memulihkan HP sendiri';
    return type;
  }

  function buildHeroGrid(){
    const grid=el('hero-grid');
    grid.innerHTML='';
    Object.entries(window.HERO_DEFS).forEach(([id,def])=>{
      const card=document.createElement('div');
      card.className='hero-card';
      const abilitiesHtml = def.abilities.map((a,i)=>
        '<div>['+(i+1)+'] <b>'+a.name+'</b> — '+abilityTypeLabel(a.type)+'</div>'
      ).join('');
      card.innerHTML=
        '<div class="hero-badge" style="border-color:'+def.color+'">'+def.icon+'</div>'+
        '<div class="hero-name">'+def.name+'</div>'+
        '<div class="hero-title">'+def.title+'</div>'+
        '<div class="hero-desc">'+def.desc+'</div>'+
        '<div class="hero-stats"><span>HP <b>'+def.maxHp+'</b></span><span>Jangkauan <b>'+def.range+'</b></span><span>Kecepatan <b>'+def.speed+'</b></span></div>'+
        '<div class="hero-abilities">'+abilitiesHtml+'</div>'+
        '<button class="btn" data-id="'+id+'">Pilih '+def.name+'</button>';
      grid.appendChild(card);
    });
    grid.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click',()=>startGame(btn.dataset.id));
    });
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

  buildHeroGrid();
})();
