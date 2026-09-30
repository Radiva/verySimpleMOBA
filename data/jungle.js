/*
  DATA HUTAN (JUNGLE)
  ===================
  MONSTER_DEFS : jenis-jenis monster netral yang bisa ditempatkan di kemp.
  Monster netral menyerang hero mana pun (pemain atau musuh) yang masuk
  jangkauannya, diam di tempat, dan memberi XP + (opsional) buff sementara
  kepada hero yang membunuhnya. Tambah entri baru untuk jenis monster baru.

    Field per jenis monster:
      name          nama monster
      hp            HP maksimum
      dmg           damage serangan
      range         jangkauan serangan (piksel)
      atkInterval   jeda antar serangan (detik)
      xpReward      XP untuk hero yang membunuhnya
      respawnTime   detik sebelum kemp ini hidup kembali setelah dibunuh
      color         warna bentuk di kanvas
      buff          opsional — objek buff sementara untuk pembunuh:
                      damageMult   pengali damage (mis. 1.25 = +25%)
                      speedMult    pengali kecepatan gerak
                      atkSpeedMult pengali kecepatan serang (>1 = lebih cepat)
                      duration     lama buff aktif (detik)
                    Hapus field "buff" seluruhnya jika tidak ingin memberi buff.

  Lokasi kemp (JUNGLE_CAMPS) TIDAK ada di file ini lagi — pindah ke
  **data/mapshape.js** (field "jungleCamps"), supaya semua koordinat
  peta (jalur, nexus, menara, safe zone, kemp) ada di satu file yang
  sama. Tiap kemp di sana merujuk salah satu id di MONSTER_DEFS bawah
  ini lewat field "monster". Tambah jenis monster baru di sini, lalu
  pakai id-nya saat menambah kemp baru di data/mapshape.js (atau lewat
  tools/map-designer.html).
*/
window.MONSTER_DEFS = {
  slime: {
    name: 'Slime Rimba',
    hp: 80,
    dmg: 6,
    range: 40,
    atkInterval: 1.1,
    xpReward: 20,
    respawnTime: 30,
    color: '#7a8f4a'
  },

  beruang: {
    name: 'Beruang Hutan',
    hp: 220,
    dmg: 16,
    range: 46,
    atkInterval: 0.9,
    xpReward: 45,
    respawnTime: 50,
    color: '#8a5a3a'
  },

  penjaga: {
    name: 'Penjaga Kuno',
    hp: 400,
    dmg: 22,
    range: 55,
    atkInterval: 0.85,
    xpReward: 80,
    respawnTime: 90,
    color: '#c99b4a',
    buff: {
      damageMult: 1.25,
      speedMult: 1.2,
      atkSpeedMult: 1.2,
      duration: 40
    }
  }

  // Contoh monster baru tanpa buff:
  // laba2: { name:'Laba-laba Racun', hp:150, dmg:14, range:44, atkInterval:1, xpReward:35, respawnTime:40, color:'#6a3a8a' }
};
