/*
  BENTUK PETA (JALUR)
  ===================
  File ini KHUSUS untuk bentuk jalur peta — dipisah dari data/config.js
  supaya gampang didesain ulang tanpa mengaduk-aduk statistik lain.

  "path" adalah daftar titik berurutan dari sisi pemain ke sisi musuh,
  sebagai PERSENTASE ukuran peta (xPct/yPct — sistem yang sama dengan
  data/config.js: 0 = kiri/atas, 1 = kanan/bawah). Jalur yang benar-benar
  digambar & dipakai untuk pergerakan adalah garis lurus yang
  menghubungkan titik-titik ini secara berurutan — jadi jalur TIDAK
  harus lurus dari ujung ke ujung, tambahkan titik di tengah untuk
  membuatnya berkelok/zig-zag sesuka kamu.

  Titik pertama & terakhir di contoh bawaan sengaja mengambil nilai
  xPct langsung dari "playerSpawn"/"enemySpawn" di data/config.js (file
  itu dimuat sebelum file ini, jadi window.GAME_CONFIG sudah tersedia) —
  supaya hero selalu mulai tepat DI DALAM koridor jalur walau kamu
  geser posisi spawn-nya nanti. Boleh diganti jadi angka xPct/yPct
  tetap biasa kalau tidak perlu ikut menyesuaikan otomatis; yang penting
  titik pertama dekat sisi pemain dan titik terakhir dekat sisi musuh.

  "laneWidthPct" mengatur lebar koridor jalur (tempat hero bebas
  bergerak menyamping & minion menyebar), sebagai persentase TINGGI
  peta, dipusatkan pada garis path di atas. Hero maupun minion tidak
  bisa keluar dari koridor ini (lihat clampToLane di js/engine/state.js)
  — kalau jalur berkelok tajam, lebarkan sedikit koridornya supaya
  tidak terasa sempit di tikungan.

  ------------------------------------------------------------------
  TIPS MENDESAIN JALUR PAKAI KANVAS (bukan menghitung xPct/yPct manual)
  ------------------------------------------------------------------
  Buka tools/map-designer.html di browser (klik dua kali, tidak perlu
  server). Alat itu:
    - menampilkan kanvas seukuran peta kamu saat ini beserta posisi
      nexus/menara/kemp hutan sebagai referensi (dibaca langsung dari
      data/config.js dan data/jungle.js),
    - memuat jalur yang sedang aktif di sini sebagai titik awal,
    - klik di kanvas kosong untuk MENAMBAH titik baru di ujung jalur,
      seret titik yang sudah ada untuk memindahkannya, klik kanan/tekan
      Delete pada titik terpilih untuk menghapusnya,
    - slider untuk mengatur lebar koridor,
    - tombol "Unduh data/mapshape.js" yang meng-generate ULANG file
      ini persis dengan format di bawah, tinggal timpa file lama.

  Contoh bawaan di bawah adalah jalur berkelok ringan berbentuk "S"
  (bukan garis lurus dari kiri ke kanan).
*/
window.MAP_SHAPE = {
  path: [
    // Titik pertama & terakhir sengaja memakai xPct yang sama dengan
    // playerSpawn/enemySpawn di data/config.js supaya hero selalu mulai
    // tepat di dalam koridor jalur, walau nanti kamu geser spawn-nya.
    { xPct: (window.GAME_CONFIG.playerSpawn||{xPct:0.036}).xPct, yPct: 0.50 },
    { xPct: 0.27, yPct: 0.24 },
    { xPct: 0.42, yPct: 0.62 },
    { xPct: 0.58, yPct: 0.62 },
    { xPct: 0.73, yPct: 0.24 },
    { xPct: (window.GAME_CONFIG.enemySpawn||{xPct:0.964}).xPct, yPct: 0.50 }
  ],
  laneWidthPct: 0.30
};
