/*
  KONFIGURASI UMUM GIM
  =====================
  Ubah angka-angka di bawah ini untuk mengatur BALANCE (HP, damage,
  jeda, level, dll) tanpa menyentuh kode mesin (folder js/engine/).
  Semua satuan waktu dalam detik.

  File ini SENGAJA tidak lagi berisi koordinat peta (posisi nexus,
  menara, kemp hutan, lebar safe zone/jalur) — semua koordinat itu ada
  di **data/mapshape.js**, supaya tata letak peta bisa didesain ulang
  di satu tempat tanpa mengaduk-aduk angka balance di sini, dan
  sebaliknya. Cuma dua titik yang tetap di sini: "playerSpawn" dan
  "enemySpawn" di bawah, karena keduanya dipakai data/mapshape.js untuk
  menyamakan ujung jalur secara otomatis (lihat komentar di sana).

  Field "xPct"/"yPct" pada playerSpawn/enemySpawn di bawah memakai
  sistem yang sama dengan data/mapshape.js: PERSENTASE dari ukuran PETA
  ("canvasW"/"canvasH"), bukan piksel absolut (0 = kiri/atas, 1 = kanan/
  bawah). Ubah "canvasW"/"canvasH" jadi ukuran ekstrem apa pun (mis.
  1600 x 300 untuk jalur sangat panjang, atau 500 x 900 untuk peta
  vertikal) dan seluruh peta — termasuk yang didefinisikan di
  data/mapshape.js — otomatis mengikuti proporsi barunya.

  ------------------------------------------------------------------
  PETA vs LAYAR (viewport) — supaya peta besar tidak "menyusut"
  ------------------------------------------------------------------
  "canvasW"/"canvasH" adalah ukuran PETA sesungguhnya (dipakai untuk
  semua perhitungan posisi & pergerakan). "viewport" di bawah adalah
  ukuran jendela kamera yang benar-benar terlihat di layar — SELALU
  tetap seukuran ini walau petanya kamu buat sangat besar. Kamera
  otomatis mengikuti hero pemain (lihat js/engine/camera.js), dan
  peta penuh selalu bisa dilihat lewat minimap.
*/
window.GAME_CONFIG = {

  // --- Menara (statistik saja — posisinya ada di data/mapshape.js) ---
  towerHp: 1000,
  towerDmg: 40,
  towerRange: 115,
  towerAtkInterval: 1,     // detik antar serangan

  // --- Nexus (statistik saja — posisinya ada di data/mapshape.js) ---
  // Berbentuk segi delapan dan MENYERANG seperti menara: memprioritaskan minion
  // musuh dulu, baru hero.
  nexus: {
    hp: 1500,
    dmg: 45,
    range: 130,
    atkInterval: 1.1,
    radius: 26             // jari-jari segi delapan (piksel)
  },

  // --- Safe zone (zona aman, TERPISAH dari nexus & lebih dalam darinya) ---
  // Jalur di tepi peta di belakang nexus tiap sisi. Lebarnya
  // (safeZoneWidthPct) ada di data/mapshape.js — di sini cuma
  // perilakunya: hero muncul (spawn/respawn) di sini, memulihkan HP
  // tiap detik selama berada di dalamnya, dan tidak bisa diserang
  // selama protectHeroes: true (hero di dalam safe zone juga tidak
  // bisa menyerang atau memakai kemampuan serangan, supaya tidak curang).
  safeZone: {
    regenRate: 25,         // HP per detik
    protectHeroes: true
  },

  // --- Titik muncul (respawn) hero — harus berada di dalam safe zone.
  // Dipakai juga oleh data/mapshape.js untuk menyamakan ujung jalur. ---
  playerSpawn: { xPct: 0.036, yPct: 0.5 },
  enemySpawn:  { xPct: 0.964, yPct: 0.5 },

  // Minion selalu muncul tepat di ujung jalur milik timnya sendiri
  // (lihat data/mapshape.js) dan berjalan MENGIKUTI BENTUK JALUR itu
  // sampai ke ujung satunya — jadi kalau jalur dibuat berkelok, minion
  // ikut berkelok, bukan jalan lurus menembus map.

  // Sebaran posisi menyamping antar-minion dalam satu gelombang, sebagai
  // PECAHAN dari setengah lebar koridor jalur (laneWidthPct di
  // data/mapshape.js): -1 = mepet ke satu sisi koridor, 0 = tengah
  // jalur, 1 = mepet ke sisi lainnya. Dipakai berulang kalau satu
  // gelombang berisi lebih banyak minion daripada jumlah elemen di sini.
  waveLaneOffsetFractions: [-0.55, 0, 0.55, -0.25, 0.25],

  // Jarak aman dari tepi peta / markas agar hero tidak menembus dinding
  // nexus (dalam piksel, tidak ikut skala persentase). Minion mengikuti
  // bentuk jalur (data/mapshape.js) jadi tidak perlu batas ini.
  heroClampMargin: 25,

  // --- Ukuran PETA (boleh dibuat ekstrem — lihat catatan di atas) ---
  canvasW: 960,
  canvasH: 400,

  // --- Ukuran LAYAR/kamera (jendela yang benar-benar terlihat) ---
  // Biasanya tidak perlu diubah walau canvasW/canvasH dibuat ekstrem —
  // kamera akan otomatis mengikuti hero di peta seukuran apa pun.
  viewport: { width: 960, height: 400 },

  // --- Minimap (peta kecil di pojok layar) ---
  minimap: {
    enabled: true,          // false = sembunyikan minimap
    corner: 'bottom-left',  // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    width: 150,             // lebar minimap dalam piksel (tinggi menyesuaikan proporsi peta)
    margin: 10              // jarak dari tepi layar
  },

  // --- Putaran panah arah hero ---
  // Kecepatan panah berputar menuju arah tombol gerak, dalam DERAJAT per detik
  // (mis. 180 = setengah putaran/detik; 720 = sangat cepat). Berlaku untuk semua
  // hero; hero tertentu bisa menimpanya dengan field "turnRate" di data/heroes.js.
  // Saat hero menyerang, panah tetap langsung menghadap target.
  heroTurnRate: 270,

  // --- Border penanda target hero pemain (sebelum & saat diserang) ---
  targetHighlight: { color: '#e5483a', lineWidth: 1.5 },

  // --- Prioritas serangan hero pemain (bisa diganti saat bermain lewat 2 tombol/shortcut) ---
  //   type   : 'minion' | 'hero' | 'building'   (urutan ganti: minion -> hero -> building -> minion)
  //   status : 'lowest' | 'highest' | 'lowestPct' | 'highestPct'
  //            (urutan ganti: HP terendah -> HP tertinggi -> HP% terendah -> HP% tertinggi)
  defaultPriority: { type: 'minion', status: 'lowest' },

  // --- Gelombang minion jalur ---
  waveInterval: 9,         // jeda antar gelombang setelah gelombang pertama
  firstWaveDelay: 3,       // jeda sebelum gelombang pertama muncul


  // --- Respawn hero setelah mati ---
  heroRespawnBase: 5,      // detik dasar
  heroRespawnPerLevel: 1.5,// tambahan detik per level hero

  // --- Leveling hero ---
  heroMaxLevel: 18,        // level tertinggi yang bisa dicapai hero
  xpPerLevelBase: 80,      // kebutuhan XP di level 1
  xpPerLevelScale: 40,     // tambahan kebutuhan XP tiap naik level
  heroLevelHpGain: 40,     // tambahan HP maksimum tiap naik level
  heroLevelDmgGain: 4,     // tambahan damage serangan biasa tiap naik level

  // --- Poin skill (leveling kemampuan, TERPISAH dari level hero) ---
  // Kemampuan tidak lagi otomatis menguat mengikuti level hero — tiap
  // kemampuan punya LEVEL SKILL sendiri (0 = belum dipelajari) yang
  // dinaikkan manual pakai poin skill. Nilai di sini adalah bawaan;
  // tiap kemampuan boleh menimpanya lewat field di data/heroes.js
  // (maxSkillLevel, unlockAtHeroLevel, levelGap).
  skillPoints: {
    perHeroLevel: 1,            // poin skill didapat tiap hero naik 1 level
    defaultMaxLevel: 5,         // batas level skill kalau ability tidak set "maxSkillLevel"
    defaultUnlockAtHeroLevel: 1,// "jeda dari level awal": level hero minimum sebelum
                                 // poin PERTAMA boleh masuk ke skill ini
    defaultLevelGap: 1          // "jeda setelah poin ditambahkan": hero harus naik
                                 // minimal segini level lagi sebelum poin BERIKUTNYA
                                 // boleh masuk ke skill yang SAMA
  }
};
