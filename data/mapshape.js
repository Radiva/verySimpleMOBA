/*
  BENTUK & KOORDINAT PETA
  =======================
  File ini menampung SEMUA koordinat/posisi di peta — jalur, nexus,
  menara, lebar safe zone, dan kemp hutan — supaya tata letak peta bisa
  didesain ulang di satu tempat tanpa mengaduk-aduk statistik lain di
  data/config.js (yang isinya cuma angka balance: HP, damage, jeda,
  dll — bukan koordinat) maupun data/jungle.js (yang isinya cuma jenis
  monster, bukan di mana kemp-nya berada).

  Semua posisi memakai PERSENTASE ukuran peta (xPct/yPct — 0 = kiri/
  atas, 1 = kanan/bawah), sama seperti sisa proyek ini, supaya kalau
  canvasW/canvasH di data/config.js diubah jadi ukuran ekstrem, seluruh
  peta ikut menyesuaikan proporsinya.

  ------------------------------------------------------------------
  DUA JALUR TERPISAH: "minionPath" (fungsional) vs "visualPath" (tampilan)
  ------------------------------------------------------------------
  - minionPath — jalur SESUNGGUHNYA yang dipakai mesin gim: ke sanalah
    minion berjalan, dan koridor di sekelilingnya (lebar diatur oleh
    laneWidthPct) adalah batas gerak hero (pemain maupun AI). Ubah ini
    kalau ingin mengubah ARAH/RUTE pertarungan yang sebenarnya.
  - visualPath — jalur yang benar-benar DIGAMBAR sebagai pita jalur di
    kanvas & minimap (lebar diatur oleh terrainWidthPct). Ini MURNI
    tampilan dan tidak memengaruhi ke mana minion berjalan atau di mana
    hero boleh bergerak — boleh dibuat berbeda dari minionPath kalau
    kamu ingin jalur terlihat lebih lebar/berkelok secara visual tanpa
    mengubah rute pertarungan sesungguhnya, atau sebaliknya.
  Bawaan: visualPath sama persis dengan minionPath (tampilan mengikuti
  fungsi apa adanya) — tinggal ganti isinya sendiri kalau mau berbeda.

  ------------------------------------------------------------------
  MENDESAIN LEWAT KANVAS (bukan menghitung xPct/yPct manual)
  ------------------------------------------------------------------
  Buka tools/map-designer.html di browser (klik dua kali, tidak perlu
  server). Alat itu:
    - menampilkan kanvas seukuran peta kamu saat ini beserta posisi
      nexus/menara/safe zone/kemp hutan sebagai referensi (dibaca
      langsung dari file ini),
    - memuat minionPath yang sedang aktif di sini sebagai titik awal,
    - klik di kanvas kosong untuk MENAMBAH titik baru di ujung jalur,
      seret titik yang sudah ada untuk memindahkannya, klik kanan/tekan
      Delete pada titik terpilih untuk menghapusnya,
    - slider untuk mengatur lebar koridor,
    - tombol "Unduh data/mapshape.js" yang meng-generate ULANG file
      ini, menimpa minionPath (dan menyamakan visualPath dengannya)
      sambil tetap mempertahankan nexus/menara/safe zone/kemp hutan
      yang sudah ada. Alat ini belum punya UI khusus untuk membuat
      visualPath berbeda dari minionPath — kalau mau, edit manual
      array "visualPath" di file hasil unduhannya.

  Contoh bawaan di bawah adalah jalur berkelok ringan berbentuk "S"
  (bukan garis lurus dari kiri ke kanan).
*/
window.MAP_SHAPE = {

  // --- Jalur fungsional: rute gerak minion & koridor gerak hero ---
  // Titik pertama & terakhir sengaja memakai xPct yang sama dengan
  // playerSpawn/enemySpawn di data/config.js (file itu dimuat sebelum
  // file ini) supaya hero selalu mulai tepat DI DALAM koridor jalur,
  // walau nanti kamu geser posisi spawn-nya. Boleh diganti jadi angka
  // tetap biasa kalau tidak perlu ikut menyesuaikan otomatis.
  minionPath: [
    { xPct: (window.GAME_CONFIG.playerSpawn||{xPct:0.036}).xPct, yPct: 0.50 },
    { xPct: 0.27, yPct: 0.24 },
    { xPct: 0.42, yPct: 0.62 },
    { xPct: 0.58, yPct: 0.62 },
    { xPct: 0.73, yPct: 0.24 },
    { xPct: (window.GAME_CONFIG.enemySpawn||{xPct:0.964}).xPct, yPct: 0.50 }
  ],
  // Lebar koridor JALUR FUNGSIONAL (persentase TINGGI peta), dipusatkan
  // pada minionPath di atas. Hero maupun minion tidak bisa keluar dari
  // koridor ini (lihat clampToLane di js/engine/state.js) — kalau
  // jalur berkelok tajam, lebarkan sedikit supaya tidak terasa sempit
  // di tikungan.
  laneWidthPct: 0.30,

  // --- Jalur visual: pita jalur yang benar-benar digambar (tampilan) ---
  // Independen dari minionPath di atas — lihat penjelasan di kepala
  // file ini. Bawaan disamakan dengan minionPath.
  visualPath: [
    { xPct: (window.GAME_CONFIG.playerSpawn||{xPct:0.036}).xPct, yPct: 0.50 },
    { xPct: 0.27, yPct: 0.24 },
    { xPct: 0.42, yPct: 0.62 },
    { xPct: 0.58, yPct: 0.62 },
    { xPct: 0.73, yPct: 0.24 },
    { xPct: (window.GAME_CONFIG.enemySpawn||{xPct:0.964}).xPct, yPct: 0.50 }
  ],
  // Lebar pita jalur visual (persentase TINGGI peta) — murni tampilan,
  // tidak memengaruhi gerak hero/minion sama sekali.
  terrainWidthPct: 0.30,

  // --- Nexus (bangunan utama; hancur = kalah). Statistiknya (hp/dmg/
  // range/atkInterval/radius) ada di CFG.nexus, data/config.js. ---
  playerNexus: { xPct: 0.125, yPct: 0.5 },
  enemyNexus:  { xPct: 0.875, yPct: 0.5 },

  // --- Menara. Statistiknya (towerHp/towerDmg/dll) ada di
  // data/config.js. Tambah/hapus objek di array untuk menambah/
  // mengurangi jumlah menara per sisi. ---
  towers: {
    player: [
      { xPct: 0.229, yPct: 0.5 }
    ],
    enemy: [
      { xPct: 0.771, yPct: 0.5 }
    ]
  },

  // --- Lebar safe zone (persentase dari canvasW). Perilakunya
  // (regenRate/protectHeroes) tetap ada di CFG.safeZone,
  // data/config.js — di sini cuma ukurannya. ---
  safeZoneWidthPct: 0.073,

  // --- Kemp hutan. Field "monster" merujuk salah satu id di
  // MONSTER_DEFS, data/jungle.js. Tambah/hapus/pindahkan objek di
  // array ini untuk mengubah tata letak hutan. Taruh kemp di luar
  // koridor jalur (LANE_WIDTH di atas) supaya minion tidak ikut
  // bertarung dengan monster hutan. ---
  jungleCamps: [
    { id: 'slime_atas_kiri',      xPct: 0.3125, yPct: 0.175, monster: 'slime' },
    { id: 'beruang_bawah_kiri',   xPct: 0.3125, yPct: 0.825, monster: 'beruang' },

    { id: 'beruang_atas_kanan',   xPct: 0.6875, yPct: 0.175, monster: 'beruang' },
    { id: 'slime_bawah_kanan',    xPct: 0.6875, yPct: 0.825, monster: 'slime' },

    { id: 'penjaga_atas_tengah',  xPct: 0.5,    yPct: 0.175, monster: 'penjaga' },
    { id: 'penjaga_bawah_tengah', xPct: 0.5,    yPct: 0.825, monster: 'penjaga' }
  ]
};
