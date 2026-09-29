/*
  DATA HERO
  =========
  Tambah hero baru dengan menambah entri baru pada objek HERO_DEFS.
  Kunci objek (mis. "baja") dipakai sebagai id internal — bebas namun
  harus unik dan tanpa spasi.

  Field wajib per hero:
    name          nama tampil singkat
    title         gelar/subjudul, tampil di kartu pemilihan
    color         warna isi lingkaran hero di kanvas (hex)
    icon          satu emoji untuk lencana di kartu pemilihan
    desc          deskripsi singkat di kartu pemilihan
    maxHp         HP maksimum awal
    dmg           damage serangan biasa
    range         jangkauan serangan biasa (piksel)
    atkInterval   jeda antar serangan biasa (detik, makin kecil makin cepat)
    speed         kecepatan gerak (piksel/detik)
    abilities     ARRAY kemampuan (lihat di bawah) — boleh berisi 1 sampai
                  4 kemampuan. Urutan array menentukan tombolnya di layar:
                  abilities[0] -> tombol 1, abilities[1] -> tombol 2,
                  abilities[2] -> tombol 3, abilities[3] -> tombol 4.

  Tiap objek di "abilities" mendukung tiga tipe (field "type"):
    - "aoe"   : merusak semua musuh di sekitar posisi hero saat ini.
                pakai field "radius" untuk jangkauan ledakan.
    - "snipe" : menembak satu musuh terdekat dari jarak jauh.
                pakai field "radius" untuk jarak maksimum target.
    - "heal"  : menyembuhkan diri sendiri sejumlah HP.
                field "radius" diabaikan untuk tipe ini.

  Damage/heal tiap kemampuan dihitung sebagai:
    baseDamage + (level hero saat ini) * perLevel

  Ingin menambah tipe kemampuan baru (mis. buff tim, dash, dsb)?
  Tambahkan penanganannya pada fungsi useAbility() di js/engine.js —
  data hero cukup mereferensikan tipe barunya lewat field "type".
*/
window.HERO_DEFS = {

  baja: {
    name: 'Baja',
    title: 'Ksatria Baja',
    color: '#c9793a',
    icon: '⚔️',
    desc: 'Petarung jarak dekat dengan HP tebal. Punya hantaman area dan kemampuan pulih diri.',
    maxHp: 420,
    dmg: 22,
    range: 46,
    atkInterval: 0.75,
    speed: 135,
    abilities: [
      { name: 'Hantaman Bumi', type: 'aoe', cooldown: 6, radius: 85, baseDamage: 50, perLevel: 8 },
      { name: 'Regenerasi Baja', type: 'heal', cooldown: 14, baseDamage: 60, perLevel: 10 }
    ]
  },

  rimba: {
    name: 'Rimba',
    title: 'Pemanah Rimba',
    color: '#4f9a6b',
    icon: '🏹',
    desc: 'Penembak jarak jauh dengan jangkauan panjang, namun HP lebih tipis. Bisa pulih sedikit demi sedikit.',
    maxHp: 300,
    dmg: 15,
    range: 185,
    atkInterval: 0.9,
    speed: 150,
    abilities: [
      { name: 'Tembakan Tajam', type: 'snipe', cooldown: 5, radius: 230, baseDamage: 65, perLevel: 10 },
      { name: 'Pulih Alami', type: 'heal', cooldown: 16, baseDamage: 45, perLevel: 8 }
    ]
  }

  // Contoh menambah hero ketiga dengan 3 kemampuan sekaligus
  // (nonaktifkan komentar dan sesuaikan angkanya untuk mencobanya):
  //
  // pendekar: {
  //   name: 'Pendekar', title: 'Pendekar Sumur', color: '#8a5ac9', icon: '🛡️',
  //   desc: 'Serba bisa dengan tiga kemampuan berbeda.',
  //   maxHp: 360, dmg: 18, range: 55, atkInterval: 0.8, speed: 140,
  //   abilities: [
  //     { name: 'Sabetan', type: 'aoe', cooldown: 5, radius: 70, baseDamage: 40, perLevel: 6 },
  //     { name: 'Panah Sumur', type: 'snipe', cooldown: 7, radius: 200, baseDamage: 55, perLevel: 9 },
  //     { name: 'Napas Sumur', type: 'heal', cooldown: 12, baseDamage: 55, perLevel: 9 }
  //   ]
  // }
};
