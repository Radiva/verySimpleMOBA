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
  peta (markas, menara, titik spawn, batas jalur) ditulis sebagai
  PERSENTASE dari ukuran PETA ("canvasW"/"canvasH"), bukan piksel
  absolut:
    xPct: 0   = paling kiri peta      xPct: 1   = paling kanan
    yPct: 0   = paling atas peta      yPct: 1   = paling bawah
    yPct: 0.5 = tepat di tengah secara vertikal

  Artinya: ubah "canvasW"/"canvasH" jadi ukuran ekstrem apa pun (mis.
  1600 x 300 untuk jalur sangat panjang, atau 500 x 900 untuk peta
  vertikal), dan seluruh markas/menara/spawn akan otomatis mengikuti
  proporsi barunya. Kamu juga tetap bebas mengubah tiap xPct/yPct
  satu-satu untuk tata letak yang benar-benar custom.

  Posisi kemp hutan (jungle) memakai sistem yang sama — lihat
  data/jungle.js.

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

  // --- Markas (nexus) ---
  baseHp: 1500,
  baseWidthPct: 0.073,     // lebar markas, sebagai persentase dari canvasW
  playerBase: { xPct: 0.036, yPct: 0.5 },
  enemyBase:  { xPct: 0.964, yPct: 0.5 },

  // --- Titik muncul (respawn) hero ---
  playerSpawn: { xPct: 0.115, yPct: 0.5 },
  enemySpawn:  { xPct: 0.885, yPct: 0.5 },

  // --- Batas jalur (area gerak vertikal hero & jalur minion) ---
  laneBounds: { topPct: 0.15, bottomPct: 0.85 },

  // Posisi vertikal minion tiap gelombang, sebagai persentase tinggi
  // peta. Jumlah elemen di sini membatasi variasi ketinggian minion
  // (dipakai berulang jika satu gelombang berisi lebih banyak minion).
  waveYOffsetsPct: [0.375, 0.5, 0.625, 0.4375, 0.5625],

  // Jarak aman dari tepi peta / markas agar unit tidak menembus
  // dinding markas (dalam piksel, tidak ikut skala persentase).
  heroClampMargin: 25,
  minionClampMargin: 80,

  // --- Ukuran PETA (boleh dibuat ekstrem — lihat catatan di atas) ---
  canvasW: 960,
  canvasH: 400,

  // --- Ukuran LAYAR/kamera (jendela yang benar-benar terlihat) ---
  // Biasanya tidak perlu diubah walau canvasW/canvasH dibuat ekstrem —
  // kamera akan otomatis mengikuti hero di peta seukuran apa pun.
  viewport: { width: 960, height: 400 },

  // --- Minimap (peta kecil di pojok layar) ---
  minimap: {
    corner: 'bottom-left',  // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    width: 150,             // lebar minimap dalam piksel (tinggi menyesuaikan proporsi peta)
    margin: 10              // jarak dari tepi layar
  },

  // --- Gelombang minion jalur ---
  waveInterval: 9,         // jeda antar gelombang setelah gelombang pertama
  firstWaveDelay: 3,       // jeda sebelum gelombang pertama muncul

  // --- Regenerasi hero dekat markas sendiri ---
  baseRegenRate: 25,       // HP per detik
  baseRegenRadius: 130,    // jarak dari markas agar regen aktif

  // --- Respawn hero setelah mati ---
  heroRespawnBase: 5,      // detik dasar
  heroRespawnPerLevel: 1.5,// tambahan detik per level hero

  // --- Leveling hero ---
  heroMaxLevel: 18,        // level tertinggi yang bisa dicapai hero
  xpPerLevelBase: 80,      // kebutuhan XP di level 1
  xpPerLevelScale: 40,     // tambahan kebutuhan XP tiap naik level
  heroLevelHpGain: 40,     // tambahan HP maksimum tiap naik level
  heroLevelDmgGain: 4      // tambahan damage serangan biasa tiap naik level
};
