# Garis Depan — MOBA Mini 1 Jalur

Gim MOBA 2D sederhana berbasis browser. Buka `index.html` langsung
dengan klik dua kali (tidak perlu server lokal — semua data dimuat
lewat tag `<script>` biasa, bukan `fetch`, jadi aman dibuka lewat
`file://`).

## Struktur folder

```
garis-depan/
├── index.html          halaman utama, tinggal buka ini di browser
├── css/
│   └── style.css        semua styling
├── data/                 <-- edit file-file di sini untuk mengubah gim
│   ├── config.js         statistik umum + LAYOUT PETA (menara, nexus, safe zone, level, dll)
│   ├── heroes.js         daftar hero + kemampuan (bisa lebih dari satu)
│   ├── minions.js        jenis minion jalur, susunan gelombang, pertumbuhan stat
│   └── jungle.js         jenis monster hutan + posisi kemp
└── js/
    ├── engine/               mesin, dipecah per modul agar mudah dikembangkan
    │   ├── state.js           namespace Engine + resolusi layout peta
    │   ├── combat.js          targeting, damage, XP, buff, kemampuan
    │   ├── movement.js        gerak hero/AI/minion, gelombang, respawn, regen
    │   ├── render.js          semua fungsi gambar ke kanvas
    │   ├── camera.js          kamera mengikuti hero + minimap pojok layar
    │   ├── hud.js             sinkronisasi panel HP/XP/kemampuan/prioritas ke DOM
    │   ├── input.js           pembacaan tombol + sistem ganti tombol (rebind)
    │   └── core.js            setup entitas, loop utama, API window.GameEngine
    └── main.js               layar pemilihan hero (daftar+detail) & modal tombol
```

## Kontrol & mengganti tombol

- **W A S D** — gerak
- **1 / 2 / 3 / 4** — pakai kemampuan sesuai urutan `abilities` hero (hero
  dengan 2 kemampuan hanya memakai tombol 1 dan 2, dst.) — hanya bisa
  dipakai kalau kemampuannya sudah dipelajari, lihat "Leveling skill"
- **Z / X / C / V** — pakai 1 poin skill untuk menaikkan level kemampuan
  1/2/3/4 (tombol TERPISAH dari 1/2/3/4 supaya "memakai" dan "menaikkan
  level" tidak bentrok)
- **Q** — ganti prioritas jenis target (Minion → Hero → Bangunan → Minion)
- **E** — ganti prioritas status (HP Terendah ↔ HP Tertinggi)
- Serangan biasa otomatis menyerang musuh terdekat saat dalam jangkauan

Semua tombol di atas bisa diganti lewat tombol **"⚙ Atur Tombol"** di
layar pemilihan hero — pilih aksi, tekan "Ubah", lalu tekan tombol baru
yang diinginkan. Pengaturan tersimpan otomatis di browser (localStorage)
sehingga tetap berlaku walau halaman ditutup dan dibuka lagi. Tombol
"Reset ke Default" mengembalikan semua ke WASD + 1/2/3/4 + Z/X/C/V + Q/E.

Setiap kotak kemampuan di HUD menampilkan **ikon/logo kemampuannya**
(dari field `icon` di `data/heroes.js`) dengan **huruf tombol pakai**
di sudut kanan-bawah, **level skill saat ini** (mis. `Lv 2/5`) di
sudut kiri-atas, dan **angka hitung mundur** menutupi ikon saat sedang
cooldown (bukan cuma efek glow) — begitu angkanya hilang dan kotak
menyala terang, kemampuan siap dipakai lagi. Kemampuan yang belum
dipelajari (level skill 0) tampil pudar dengan ikon 🔒 dan tidak bisa
dipakai sama sekali. Kotak berpendar **hijau** dengan huruf tombol
naik-level di sudut kiri-bawah kalau kamu sedang punya poin skill yang
bisa dipakai untuk kemampuan itu sekarang juga.

## Leveling skill (poin skill, terpisah dari level hero)

Kemampuan **tidak lagi otomatis menguat** mengikuti level hero. Tiap
kemampuan punya **level skill sendiri** (0 = belum dipelajari, tidak
bisa dipakai) yang harus dinaikkan manual pakai **poin skill**:

- Hero mendapat poin skill setiap naik level hero — jumlahnya diatur
  lewat `skillPoints.perHeroLevel` di `data/config.js` (bawaan: 1 poin
  per level).
- Tekan **Z / X / C / V** untuk memakai 1 poin skill menaikkan level
  kemampuan 1/2/3/4. Panel hero pemain menampilkan **"N Poin Skill"**
  kalau ada poin yang belum dipakai.
- Hero musuh (AI) otomatis membelanjakan poin skillnya sendiri begitu
  ada kemampuan yang memenuhi syarat.

Dua jeda yang bisa diatur per kemampuan di `data/heroes.js` (atau lewat
nilai bawaan `skillPoints` di `data/config.js` kalau tidak ditulis per
kemampuan):

- **`unlockAtHeroLevel`** — "jeda dari level awal": level hero minimum
  sebelum poin **pertama** boleh masuk ke kemampuan ini. Cocok untuk
  meniru kemampuan andalan/ultimate yang baru terbuka belakangan.
- **`levelGap`** — "jeda setelah poin ditambahkan": minimal berapa
  level hero harus lewat sejak poin **terakhir** masuk ke kemampuan
  yang sama sebelum boleh menambah poin lagi ke kemampuan itu. Nilai
  bawaan 1 secara alami membatasi maksimal 1 poin per kemampuan setiap
  kali hero naik level (gaya MOBA umum); naikkan jadi 2 atau lebih
  untuk memaksa pemain menyebar poinnya ke kemampuan lain dulu.
- **`maxSkillLevel`** — batas level tertinggi kemampuan ini bisa
  dinaikkan. Poin yang tersisa setelah sebuah kemampuan mentok tidak
  hilang — bisa dipakai untuk kemampuan lain.

Damage/heal kemampuan dihitung dari **level skill**, bukan level hero:
`baseDamage + (level skill saat ini - 1) * perLevel`.

## Prioritas serangan

Dua indikator di panel hero pemain menampilkan pengaturan prioritas saat
ini, mis. `Prioritas: Minion [Q]`. Indikator ini **tidak bisa diklik** —
gim dirancang full keyboard saat pertandingan, jadi prioritas hanya
diganti lewat shortcut **Q** dan **E** (bisa diganti di "⚙ Atur Tombol").
Prioritas menentukan target mana yang diserang duluan saat ada beberapa
musuh dalam jangkauan sekaligus:

- **"Prioritas: ..."** (tombol **Q**) — jenis target yang diutamakan,
  berputar tiap ditekan: **Minion → Hero → Bangunan → Minion → ...** (jenis yang
  dipilih dicoba lebih dulu; kalau tidak ada target jenis itu dalam
  jangkauan, otomatis lanjut ke jenis berikutnya di urutan tersebut).
- **"Fokus: ..."** (tombol **E**) — di antara target sejenis, pilih
  berdasarkan status. Urutan ganti: **HP Terendah → HP Tertinggi →
  HP% Terendah → HP% Tertinggi → ...**. "HP" membandingkan angka HP
  mentah; "HP%" membandingkan persentase HP terhadap HP maksimum
  (mis. minion 50/100 = 50% lebih "rendah" dari hero 300/400 = 75%
  walau angka HP-nya lebih kecil). Jarak hanya dipakai sebagai pemecah
  seri. "Bangunan" mencakup menara dan nexus.

Monster hutan hanya diserang kalau tidak ada minion/hero/bangunan dalam
jangkauan. Nilai awal kedua pengaturan ini bisa diubah lewat
`defaultPriority` di `data/config.js`.

Pengaturan ini berlaku untuk serangan biasa hero pemain dan kemampuan
bertipe `snipe` miliknya. Musuh (AI), minion, dan menara tetap memakai
target terdekat seperti biasa.

## Kamera & minimap (peta besar)

Peta tidak lagi diperkecil supaya muat di layar. Ukuran layar (`viewport`
di `data/config.js`) selalu tetap, sedangkan peta (`canvasW`/`canvasH`)
boleh jauh lebih besar — **kamera mengikuti hero pemain** dan berhenti di
tepi peta. Kalau peta lebih kecil dari layar, peta ditaruh di tengah.
Selama hero menunggu respawn, kamera tetap di tempat hero terakhir dan
layar menampilkan hitung mundur **"BANGKIT DALAM Ns"** di tengah kamera.

**Minimap** menampilkan seluruh peta (safe zone, nexus, menara, minion, monster
hutan, kedua hero) beserta kotak putih penanda area yang sedang terlihat.
Atur lewat `minimap` di `data/config.js`:

- `enabled` — `true` / `false`
- `corner` — `'top-left'`, `'top-right'`, `'bottom-left'` (bawaan), atau
  `'bottom-right'`
- `width` — lebar minimap (tinggi menyesuaikan proporsi peta)
- `margin` — jarak dari tepi layar

Untuk mencoba kamera, ubah `canvasW` jadi mis. `2400` di `data/config.js`.

## Nexus & safe zone (dua hal terpisah)

Sisi tiap tim punya dua elemen berbeda, disusun dari tepi peta ke tengah:
**safe zone → nexus → menara → jalur**. Safe zone ada di posisi yang
*lebih dalam* dari nexus (paling dekat tepi peta).

- **Nexus** — bangunan utama berbentuk **segi delapan**. Hancur = tim itu
  kalah. Nexus **menyerang seperti menara**: memprioritaskan minion
  musuh yang masuk jangkauan, baru hero, dan mengabaikan monster hutan.
  Diatur lewat `nexus` (`hp`, `dmg`, `range`, `atkInterval`, `radius`)
  dan `playerNexus`/`enemyNexus` (posisi) di `data/config.js`.
- **Safe zone** — jalur di tepi peta di belakang nexus (label "ZONA
  AMAN"). Hero **muncul dan respawn di sini**, **memulihkan HP** selama
  berada di dalamnya, dan — selama `protectHeroes: true` — **tidak bisa
  diserang** (sebagai gantinya hero di dalam zona juga tidak bisa
  menyerang atau memakai kemampuan serangan; kemampuan `heal` tetap
  boleh). Diatur lewat `safeZone` (`widthPct`, `regenRate`,
  `protectHeroes`) dan `playerSpawn`/`enemySpawn` (harus berada di dalam
  zona) di `data/config.js`.
- Minion muncul di depan nexus, di titik `waveSpawnXPct` (persentase
  lebar peta) — ikut menyesuaikan kalau peta dibuat sangat lebar.

## Timer respawn

Saat sebuah hero mati, hitung mundur respawn tampil di dua tempat: **tag
merah "Bangkit dalam Ns" di panel info atas** (panel pemain dan musuh
masing-masing) dan **overlay di tengah kamera** untuk hero pemain.
Lamanya = `heroRespawnBase + level × heroRespawnPerLevel` (`config.js`).

## Tampilan hero di kanvas

Selain lingkaran berwarna tim, hero menampilkan **ikon hero** (sama
seperti di layar pemilihan) di tengah lingkaran, plus **panah kecil**
di tepi lingkaran yang menunjukkan arah hadap hero.

- **Panah berputar halus.** Saat kamu menekan tombol gerak, panah tidak
  langsung menghadap arah itu — ia berputar lewat jalur terpendek dengan
  kecepatan `heroTurnRate` (derajat/detik, di `data/config.js`; bawaan
  270). Hero tertentu bisa punya kecepatan sendiri lewat field opsional
  `turnRate` di `data/heroes.js`. Hero musuh (AI) memakai aturan yang sama.
- **Saat menyerang, panah langsung menghadap target** (serangan biasa
  maupun kemampuan `snipe`), lalu kembali berputar halus ke arah tombol
  gerak yang sedang ditekan.
- **Border merah tipis** muncul pada target yang sedang dibidik hero
  pemain, sejak target masuk jangkauan (sebelum diserang) sampai saat
  diserang. Target mengikuti pengaturan prioritas. Warna & ketebalan
  border diatur lewat `targetHighlight` di `data/config.js`.

## Layar pemilihan hero

Layar awal terbagi dua kolom: **daftar hero di kiri** (klik salah satu
untuk melihat detailnya) dan **panel detail lengkap di kanan** (stat,
daftar kemampuan beserta tombolnya, dan tombol "Pilih Hero Ini"). Klik
hero mana pun di daftar kiri untuk mengganti apa yang ditampilkan di
kanan sebelum benar-benar memulai pertandingan.

## Mengedit statistik gim & LAYOUT PETA

Buka **`data/config.js`** — semua angka balancing umum ada di sana
(HP menara/nexus, damage menara & nexus, jeda gelombang, regen safe zone,
waktu respawn hero, kebutuhan XP per level, **batas level maksimum**),
lengkap dengan komentar penjelas di setiap baris.

File yang sama juga mengatur **layout peta**. Posisi nexus, safe zone, menara,
titik spawn, dan batas jalur ditulis sebagai persentase (`xPct`/`yPct`,
0 = kiri/atas, 1 = kanan/bawah) dari ukuran kanvas (`canvasW`/`canvasH`),
bukan piksel tetap. Ini dibuat khusus supaya kamu bisa mengubah peta
secara ekstrem:

- Ganti `canvasW`/`canvasH` ke ukuran apa pun (mis. `1600 x 300` untuk
  jalur sangat panjang, atau `500 x 900` untuk peta vertikal) — nexus,
  menara, dan spawn otomatis ikut menyesuaikan proporsi.
- Tambah lebih dari satu menara per sisi lewat array `towers.player` /
  `towers.enemy` — cocok untuk jalur panjang dengan beberapa lapis
  pertahanan.
- Ubah `laneBounds` untuk mempersempit/melebarkan area gerak vertikal
  hero dan jalur minion.

## Menambah hero baru & banyak kemampuan sekaligus

Buka **`data/heroes.js`** dan tambahkan entri baru ke objek
`HERO_DEFS`. Kartu pemilihan hero di layar awal otomatis dibuat dari
isi file ini.

Setiap hero punya field `abilities` — sebuah **array**, boleh berisi
1 sampai 4 objek kemampuan. Urutan di array menentukan tombolnya:
`abilities[0]` → tombol **1**, `abilities[1]` → tombol **2**, dst.

Setiap kemampuan juga bisa diberi field opsional untuk mengatur
leveling-nya (lihat bagian "Leveling skill" di atas): `maxSkillLevel`,
`unlockAtHeroLevel`, `levelGap`.

Tiga tipe kemampuan siap pakai:

| type    | efek                                              |
|---------|---------------------------------------------------|
| `aoe`   | merusak semua musuh di sekitar posisi hero saat ini |
| `snipe` | menembak satu musuh terdekat dari jarak jauh        |
| `heal`  | menyembuhkan diri sendiri                          |

Contoh hero dengan 3 kemampuan sekaligus sudah disediakan sebagai
komentar di bagian bawah `data/heroes.js`.

Ingin tipe kemampuan yang benar-benar baru (misalnya buff tim atau
dash)? Tambahkan penanganannya di fungsi `useAbility()` pada
`js/engine/combat.js`, lalu rujuk tipe barunya dari data hero.

## Menambah jenis minion, mengubah gelombang, & pertumbuhan stat

Buka **`data/minions.js`**:
- Tambah entri baru ke `MINION_DEFS` untuk membuat jenis minion baru.
- Ubah array `WAVE_COMPOSITION` untuk mengatur jenis & jumlah minion
  yang muncul tiap gelombang (mis. `['normal','normal','kuat']`).
- Atur `MINION_GROWTH` untuk membuat minion **makin kuat seiring
  berjalannya pertandingan** — HP/damage/kecepatan dasar bertambah
  setiap gelombang baru muncul, dikalikan jumlah gelombang yang sudah
  lewat. Set nilainya ke `0` untuk menonaktifkan pertumbuhan tertentu.

## Sistem hutan (jungle) & menambah monster

Buka **`data/jungle.js`**:
- `MONSTER_DEFS` — jenis-jenis monster netral (HP, damage, XP, waktu
  respawn, dan opsional `buff` sementara untuk hero yang membunuhnya).
- `JUNGLE_CAMPS` — daftar kemp di peta (posisi pakai `xPct`/`yPct`
  seperti di `config.js`, jadi ikut menyesuaikan kalau kamu mengubah
  ukuran kanvas). Tambah, hapus, atau pindahkan objek di array ini
  untuk mengubah tata letak hutan.

Monster hutan diam di tempat, hanya menyerang hero (bukan minion atau
menara), dan hidup kembali otomatis setelah `respawnTime` detik. Kemp
"Penjaga Kuno" bawaan memberi buff sementara (damage, kecepatan gerak,
dan kecepatan serang) kepada hero yang berhasil membunuhnya.

## XP & level

Panel hero pemain dan musuh masing-masing punya bar XP dengan angka
persis (mis. `120 / 200 XP`) di bawah bar HP. Setelah mencapai level
maksimum (`heroMaxLevel` di `config.js`), bar menampilkan **LEVEL
MAKS** dan hero berhenti mengumpulkan XP.

Naik level hero **tidak lagi otomatis memperkuat kemampuan** — yang
otomatis bertambah hanya HP maksimum dan damage serangan biasa
(`heroLevelHpGain`/`heroLevelDmgGain`), ditambah pemberian poin skill.
Kekuatan kemampuan sendiri diatur lewat sistem "Leveling skill" di
atas.
