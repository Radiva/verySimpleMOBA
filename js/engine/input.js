/*
  ENGINE / INPUT & KEY REBINDING
  ==============================
  Menyimpan pemetaan aksi -> tombol fisik ("bindings"), membaca status
  tombol tiap frame untuk pergerakan (Engine.Input.isDown), dan memicu
  kemampuan saat tombolnya ditekan.

  Pengaturan tombol disimpan di localStorage browser (per-perangkat),
  jadi tetap tersimpan walau halaman ditutup dan dibuka lagi. Ini AMAN
  dipakai di sini karena proyek ini dibuka langsung sebagai file lokal
  oleh satu orang, bukan dipublikasikan sebagai halaman multi-pengguna.

  Aksi yang bisa diatur ulang:
    up, down, left, right        — gerak (default W A S D)
    ability1..ability4           — kemampuan hero ke-1 s.d. ke-4
                                    (default tombol 1 2 3 4)

  js/main.js memanggil fungsi-fungsi ini lewat window.GameEngine
  (lihat core.js) untuk membangun layar "Atur Tombol".
*/
window.Engine = window.Engine || {};

(function(){
  "use strict";
  const E = window.Engine;

  const DEFAULTS = {
    up:'w', down:'s', left:'a', right:'d',
    ability1:'1', ability2:'2', ability3:'3', ability4:'4'
  };
  const ACTION_LABELS = {
    up:'Gerak Atas', down:'Gerak Bawah', left:'Gerak Kiri', right:'Gerak Kanan',
    ability1:'Kemampuan 1', ability2:'Kemampuan 2', ability3:'Kemampuan 3', ability4:'Kemampuan 4'
  };
  const STORAGE_KEY = 'garisdepan_keybindings_v1';

  function loadBindings(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw) return Object.assign({}, DEFAULTS, JSON.parse(raw));
    }catch(e){ /* localStorage tidak tersedia — pakai default */ }
    return Object.assign({}, DEFAULTS);
  }
  function saveBindings(b){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(b)); }catch(e){}
  }

  let bindings = loadBindings();

  function getBindings(){ return Object.assign({}, bindings); }
  function getActionLabels(){ return Object.assign({}, ACTION_LABELS); }

  function setBinding(action,key){
    if(!(action in DEFAULTS) || !key) return false;
    bindings[action] = key.toLowerCase();
    saveBindings(bindings);
    return true;
  }

  function resetBindings(){
    bindings = Object.assign({}, DEFAULTS);
    saveBindings(bindings);
  }

  function isDown(action){
    const key = bindings[action];
    return !!E.state.keys[key];
  }

  // Mulai menunggu satu kali tekan tombol untuk diikat ke "action".
  // onDone dipanggil setelah tombol baru berhasil disimpan.
  function beginRebind(action, onDone){
    E.state.rebindingAction = action;
    E.state.rebindingCallback = onDone;
  }

  window.addEventListener('keydown', e=>{
    const key = e.key.toLowerCase();
    E.state.keys[key]=true;

    if(E.state.rebindingAction){
      e.preventDefault();
      setBinding(E.state.rebindingAction, key);
      const cb = E.state.rebindingCallback;
      E.state.rebindingAction=null;
      E.state.rebindingCallback=null;
      if(cb) cb();
      return;
    }

    for(let i=0;i<4;i++){
      const action='ability'+(i+1);
      if(key===bindings[action]){
        e.preventDefault();
        if(E.state.game && E.state.game.state==='playing') E.Combat.useAbility(E.state.playerHero, i);
      }
    }
  });
  window.addEventListener('keyup', e=>{ E.state.keys[e.key.toLowerCase()]=false; });

  window.Engine.Input = {
    getBindings, getActionLabels, setBinding, resetBindings, isDown, beginRebind, DEFAULTS
  };
})();
