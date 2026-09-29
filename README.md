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
│   ├── config.js         statistik umum + LAYOUT PETA (menara, markas, level, dll)
│   ├── heroes.js         daftar hero + kemampuan (bisa lebih dari satu)
│   ├── minions.js        jenis minion jalur, susunan gelombang, pertumbuhan stat
│   └── jungle.js         jenis monster hutan + posisi kemp
└── js/
    ├── engine.js         mesin simulasi, tempur, AI, render (jarang perlu diubah)
    └── main.js           membangun layar pemilihan hero dari data/heroes.js
```

## Kontrol

- **W A S D** — gerak
- **1 / 2 / 3 / 4** — pakai kemampuan sesuai urutan `abilities` hero (hero
  dengan 2 kemampuan hanya memakai tombol 1 dan 2, dst.)
- Serangan biasa otomatis menyerang musuh terdekat saat dalam jangkauan

Setiap kotak kemampuan di HUD menampilkan **angka hitung mundur** saat
sedang cooldown (bukan cuma efek glow) — begitu angkanya hilang dan
kotak menyala terang, kemampuan siap dipakai lagi.

## Mengedit statistik gim & LAYOUT PETA

Buka **`data/config.js`** — semua angka balancing umum ada di sana
(HP menara/markas, damage menara, jeda gelombang, regen dekat markas,
waktu respawn hero, kebutuhan XP per level, **batas level maksimum**),
lengkap dengan komentar penjelas di setiap baris.

File yang sama juga mengatur **layout peta**. Posisi markas, menara,
titik spawn, dan batas jalur ditulis sebagai persentase (`xPct`/`yPct`,
0 = kiri/atas, 1 = kanan/bawah) dari ukuran kanvas (`canvasW`/`canvasH`),
bukan piksel tetap. Ini dibuat khusus supaya kamu bisa mengubah peta
secara ekstrem:

- Ganti `canvasW`/`canvasH` ke ukuran apa pun (mis. `1600 x 300` untuk
  jalur sangat panjang, atau `500 x 900` untuk peta vertikal) — markas,
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
`js/engine.js`, lalu rujuk tipe barunya dari data hero.

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
