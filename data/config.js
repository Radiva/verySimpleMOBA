/*
  KONFIGURASI UMUM GIM
  =====================
  Ubah angka-angka di bawah ini untuk mengatur balance & LAYOUT PETA
  tanpa menyentuh kode mesin (folder js/engine/). Semua satuan waktu
  dalam detik.

  ------------------------------------------------------------------
  TENTANG LAYOUT PETA (canvasW/canvasH & semua field "xPct"/"yPct")
  ------------------------------------------------------------------
  Supaya kamu bisa mengubah peta secara EKSTREM (peta sangat lebar,
  sangat tinggi, jalur dipindah, menara ditambah, dsb) tanpa harus
  menghitung ulang koordinat piksel satu-satu, posisi setiap elemen
  peta (nexus, menara, titik spawn, batas jalur) ditulis sebagai
  PERSENTASE dari ukuran PETA ("canvasW"/"canvasH"), bukan piksel
  absolut:
    xPct: 0   = paling kiri peta      xPct: 1   = paling kanan
    yPct: 0   = paling atas peta      yPct: 1   = paling bawah
    yPct: 0.5 = tepat di tengah secara vertikal

  Artinya: ubah "canvasW"/"canvasH" jadi ukuran ekstrem apa pun (mis.
  1600 x 300 untuk jalur sangat panjang, atau 500 x 900 untuk peta
  vertikal), dan seluruh nexus/menara/spawn akan otomatis mengikuti
  proporsi barunya. Kamu juga tetap bebas mengubah tiap xPct/yPct
  satu-satu untuk tata letak yang benar-benar custom.

  Posisi kemp hutan (jungle) memakai sistem yang sama — lihat
  data/jungle.js. Bentuk JALUR (lurus atau berkelok) sekarang punya
  file sendiri: data/mapshape.js — lihat file itu untuk mendesainnya,
  termasuk lewat alat bantu kanvas di tools/map-designer.html.

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

  // --- Menara ---
  towerHp: 1000,
  towerDmg: 40,
  towerRange: 115,
  towerAtkInterval: 1,     // detik antar serangan

  // Daftar menara per sisi. Tambah/hapus objek di array ini untuk
  // menambah jumlah menara (mis. 2-3 menara berurutan di satu sisi
  // untuk peta jalur panjang). Semua menara memakai stat towerHp/
  // towerDmg/towerRange/towerAtkInterval di atas.
  towers: {
    player: [
      { xPct: 0.229, yPct: 0.5 }
    ],
    enemy: [
      { xPct: 0.771, yPct: 0.5 }
    ]
  },

  // --- Nexus (bangunan utama; hancur = kalah) ---
  // Berbentuk segi delapan dan MENYERANG seperti menara: memprioritaskan minion
  // musuh dulu, baru hero. Letaknya di depan safe zone (lihat di bawah).
  nexus: {
    hp: 1500,
    dmg: 45,
    range: 130,
    atkInterval: 1.1,
    radius: 26             // jari-jari segi delapan (piksel)
  },
  playerNexus: { xPct: 0.125, yPct: 0.5 },
  enemyNexus:  { xPct: 0.875, yPct: 0.5 },

  // --- Safe zone (zona aman, TERPISAH dari nexus & lebih dalam darinya) ---
  // Jalur di tepi peta di belakang nexus tiap sisi. Hero muncul (spawn/respawn)
  // di sini, memulihkan HP tiap detik selama berada di dalamnya, dan tidak bisa
  // diserang selama protectHeroes: true (hero di dalam safe zone juga tidak bisa
  // menyerang atau memakai kemampuan serangan, supaya tidak curang).
  safeZone: {
    widthPct: 0.073,       // lebar zona, persentase dari canvasW
    regenRate: 25,         // HP per detik
    protectHeroes: true
  },

  // --- Titik muncul (respawn) hero — harus berada di dalam safe zone ---
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
