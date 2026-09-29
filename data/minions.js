/*
  DATA MINION JALUR
  =================
  MINION_DEFS  : daftar jenis minion yang bisa dipakai. Tambah entri baru
                 untuk membuat jenis minion baru (mis. minion tank, minion
                 cepat, minion pemberi jarak jauh, dsb).

    Field per jenis minion:
      name         nama (tampil di HP bar jika diperlukan nanti)
      hp           HP maksimum
      dmg          damage serangan
      range        jangkauan serangan (piksel)
      atkInterval  jeda antar serangan (detik)
      speed        kecepatan maju di jalur (piksel/detik)
      color        warna lingkaran (dipakai untuk sisi pemain; sisi musuh
                   otomatis memakai warna kemerahan bawaan mesin)
      xpReward     XP yang diberikan ke hero musuh saat minion ini mati

  WAVE_COMPOSITION : array id jenis minion yang dimunculkan setiap
                     gelombang, satu per slot. Urutan menentukan posisi
                     vertikal minion saat spawn. Tambah/kurangi elemen
                     untuk mengubah jumlah minion per gelombang, atau
                     ganti isinya untuk mencampur jenis minion.
*/
window.MINION_DEFS = {
  normal: {
    name: 'Prajurit',
    hp: 60,
    dmg: 8,
    range: 32,
    atkInterval: 1,
    speed: 58,
    color: '#6fa0c4',
    xpReward: 15
  },

  kuat: {
    name: 'Prajurit Berat',
    hp: 130,
    dmg: 12,
    range: 34,
    atkInterval: 1.2,
    speed: 42,
    color: '#8a6a3a',
    xpReward: 25
  }

  // Contoh menambah jenis minion cepat & rapuh:
  // cepat: { name:'Pengintai', hp:35, dmg:5, range:28, atkInterval:0.8, speed:85, color:'#c9c96f', xpReward:12 }
};

// Susunan tiap gelombang — ganti/tambahkan id sesuai MINION_DEFS di atas.
// Contoh mencampur jenis: ['normal','normal','kuat']
window.WAVE_COMPOSITION = ['normal', 'normal', 'normal'];

/*
  PENINGKATAN STAT MINION SEPANJANG GIM
  ======================================
  Supaya pertandingan yang berlangsung lama tidak terasa itu-itu saja,
  minion bisa menjadi lebih kuat setiap gelombang baru muncul. Nilai di
  bawah ini DITAMBAHKAN ke hp/dmg/speed dasar tiap jenis minion
  (dikalikan jumlah gelombang yang sudah lewat — gelombang pertama
  selalu memakai stat dasar, gelombang kedua +1x nilai ini, gelombang
  ketiga +2x, dan seterusnya).

  Set nilainya ke 0 untuk menonaktifkan peningkatan tertentu.
*/
window.MINION_GROWTH = {
  hpPerWave: 6,     // tambahan HP tiap gelombang
  dmgPerWave: 1,    // tambahan damage tiap gelombang
  speedPerWave: 0   // tambahan kecepatan tiap gelombang (biasanya biarkan 0)
};
