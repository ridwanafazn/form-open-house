# DESIGN

Versi terbaru. Arah visual: sketsa pena di atas kertas buku catatan, tetap doff, menyenangkan, dan tepercaya untuk orang tua. Konteks isi: jurusan RPL dan DKV, sekolah Islam berasrama khusus putra di Jalancagak, Subang.

## Prinsip

1. Cangkang main main, isi rapi. Sketsa dipakai di hero, pembatas bagian, dan sudut kartu. Info acara dan form tetap bersih dengan susunan jelas.
2. Semua halaman terbaca penuh tanpa JavaScript. Animasi hanya tambahan.
3. Mulai dari HP. Sebagian besar pengunjung datang dari Instagram di HP.
4. Hanya benda yang digambar. Tidak ada wajah atau figur manusia.

## Aturan doff, tidak boleh dilanggar

1. Tidak ada gradien dalam bentuk apa pun.
2. Tidak ada `box-shadow`, `text-shadow`, `filter: blur`, `backdrop-filter`, atau efek kilau dan cahaya.
3. Permukaan utama bukan putih murni dan teks bukan hitam pekat.
4. Warna datar. Bidang warna besar berupa satu warna saja.
5. Sudut kecil, 6 sampai 8 piksel. Tidak ada bentuk pil.
6. Tombol padat satu warna dengan garis tepi. Saat ditekan bergeser 2 piksel ke bawah. Tidak ada efek menyala.
7. Fokus keyboard berupa garis luar padat 2 piksel dengan jarak 2 piksel.
8. Foto tanpa lapisan kilap. Foto dipasang seperti polaroid di kertas krem dengan selotip datar.
9. Tidak ada emoji dan tidak ada pustaka ikon. Semua ikon adalah sketsa buatan sendiri.
10. Tidak ada filter SVG yang dianimasikan.

## Foto

1. Foto asli sekolah dipakai di landing: latar hero, empat pilar, dan band suasana sekolah.
2. Latar hero memakai lapisan gelap datar satu warna, bukan gradien atau blur.
3. Foto pilar ditampilkan abu-abu dengan lapisan kertas datar; label tetap terbaca.
4. Foto band memakai panel teks matte solid. Di HP panel turun ke bawah foto.
5. Semua foto self-hosted, sisi terpanjang maksimal 1920 piksel, JPEG terkompresi, dan punya teks alternatif yang menyebut isi foto.
6. Crop mobile memakai `object-position`, bukan mengecilkan seluruh foto.

## Token

Tulis di `src/styles/global.css`.

```css
:root {
  --paper: #F4EFE4;
  --paper-grid: #E3DCCB;
  --ink: #22262A;
  --ink-soft: #5B6068;
  --teal: #1B9A94;
  --teal-pale: #D6E8E4;
  --teal-dark: #0F6F6A;
  --gold: #D4AC6C;
  --maroon: #800000;
  --error: #A32020;
  --success: #1E7A4D;

  --radius: 6px;
  --line: 2px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
}
```

Aturan pemakaian warna:

1. Teks dan garis memakai `--ink`. Teks kecil berwarna memakai `--teal-dark` yang kontrasnya sekitar 6 banding 1 di atas kertas.
2. `--teal` hanya untuk bidang besar dan elemen dekoratif, jangan untuk teks kecil karena kontrasnya kurang.
3. `--gold` hanya sebagai stabilo dan latar aksen, jangan untuk teks.
4. `--maroon` hanya sedikit, sebagai coretan atau stiker penekanan.
5. Latar halaman `--paper` dengan kotak buku dari CSS saja, garis `--paper-grid` setiap 24 piksel. Tidak ada gambar tekstur.

## Tipografi

1. Judul memakai Space Grotesk, ukuran fluid dengan `clamp`.
2. Semua teks lain memakai DM Sans. Ukuran isi minimal 16 piksel, tinggi baris 1,5.
3. Label isian memakai DM Sans miring. Isian dan teks panjang tidak pernah memakai font tulisan tangan.

## Tata letak

1. HP: satu kolom. Hero, cerita, info acara, form, penutup.
2. Desktop: bagian form memakai dua kolom. Kiri judul dan sketsa kubah, buku terbuka, dan laptop dengan garis tipis. Kanan lembar isian. Bagian cerita boleh berselang seling kiri dan kanan.
3. Tombol Daftar Hadir Open House menempel di bawah layar HP setelah hero lewat, dan hilang saat bagian form terlihat.
4. Lebar isi maksimal 1120 piksel, dipusatkan.
5. Pembatas antar bagian berupa tepi kertas sobek dalam SVG statis, bukan gambar raster.

## Sketsa

Setiap sketsa adalah komponen React atau Astro berisi SVG inline di `src/components/doodles/`. Aturan gambar:

1. Garis tinta `--ink` setebal 3 satuan, `stroke-linecap` dan `stroke-linejoin` bulat.
2. Garis sengaja tidak sempurna: sedikit miring, ketebalan tidak seragam lewat dua jalur tumpang tindih, sudut tidak terlalu simetris.
3. Isi warna adalah bidang datar yang digeser 4 sampai 6 satuan dari garisnya, seperti hasil cetak yang tidak pas.
4. Setiap berkas di bawah 2 KB, tanpa filter, tanpa gradien.
5. Setiap komponen menerima properti `size` dan `className`, serta `aria-hidden="true"` karena hanya dekoratif.

Daftar sketsa awal:

1. `Dome`: kubah dan menara seperti di logo.
2. `OpenBook`: buku terbuka.
3. `PenNib`: pena dengan mata pena.
4. `Laptop`: laptop terbuka, di layar ada kursor dan dua kurung sudut berkode.
5. `Bezier`: kurva bezier dengan dua titik jangkar dan garis pegangan, simbol DKV.
6. `Palette`: palet warna dengan tiga bulatan.
7. `Camera`: kamera dengan tripod pendek.
8. `Futsal`: bola futsal.
9. `Lamp`: lampu belajar.
10. `PaperPlane`: pesawat kertas, dipakai di halaman terima kasih dan tombol kirim.
11. `Check`: tanda centang yang digambar.
12. `Tape`: selotip datar berwarna `--teal-pale`.
13. `Underline`: garis stabilo `--gold` untuk judul.
14. `Spark`: percikan kecil tiga garis.

Jika waktu terbatas, kerjakan 1, 2, 4, 5, 10, 11, 12, 13 dulu. Sketsa ini nanti boleh diganti gambar buatan siswa DKV dengan nama berkas dan ukuran yang sama.

## Gerak

Gunakan `LazyMotion` dengan `domAnimation` dan komponen `m`. Hanya `transform` dan `opacity`. Jika `prefers-reduced-motion` aktif, tampilkan keadaan akhir tanpa animasi.

1. Judul hero: muncul per kata, geser naik 12 piksel dan memudar masuk, jeda 60 ms antar kata, 600 ms. Dibuat dengan CSS agar tidak menunggu React.
2. Garis sketsa seperti digambar pena: animasikan `pathLength` dari 0 ke 1 saat masuk layar, 700 ms.
3. Garis stabilo di judul tersapu dari kiri ke kanan dengan `scaleX`, 500 ms.
4. Stiker dan polaroid ditempel: skala 0,9 ke 1 dengan sedikit miring dan pegas halus saat masuk layar.
5. Bagian cerita: dua atau tiga adegan memakai `useScroll` dan `useTransform` untuk menggeser foto dan sketsa pelan. Selain itu cukup masuk dengan fade dan geser.
6. Pindah langkah form: geser dan fade, 250 ms, dengan `AnimatePresence`.
7. Daftar tugas progres form: centang digambar saat langkah selesai, 300 ms.
8. Halaman terima kasih: pesawat kertas melintas sekali, centang digambar. Tanpa konfeti.

## Form

1. Isian bergaris bawah di atas kertas, seperti menulis di garis buku. Label di atas isian, tidak hanya placeholder.
2. Pilihan memakai chip persegi kecil dengan garis tepi. Chip terpilih berisi `--teal-pale` dengan garis `--teal-dark`.
3. Dua langkah. Di atas form ada daftar tugas dengan dua butir yang dicentang saat selesai.
4. Langkah satu: nama anak, nomor HP orang tua atau wali, nama orang tua atau wali.
5. Langkah dua: jumlah yang hadir, asal kota atau kabupaten, asal sekolah, minat jurusan, persetujuan.
6. Jumlah yang hadir memakai tombol kurang dan tambah dengan angka di tengah, bawaan 2.
7. Minat jurusan memakai tiga chip: RPL, DKV, Belum tahu.
8. Tinggi area sentuh minimal 44 piksel. Nomor HP memakai `inputmode="tel"` dan `autocomplete="tel"`.
9. Pesan kesalahan muncul dekat isian, singkat, dan fokus pindah ke isian pertama yang salah.
10. Tombol kirim menunjukkan status memuat dan mencegah kirim ganda.
11. Data di langkah satu tidak hilang saat kembali dari langkah dua.

## Halaman admin

Fungsional dan polos. Memakai token yang sama dan aturan doff yang sama, tanpa sketsa dan tanpa animasi. Tabel yang bisa digulir ke samping di HP. Kontras tinggi.

## Aksesibilitas

1. Urutan judul benar, penanda wilayah halaman jelas.
2. Fokus terlihat di semua elemen interaktif.
3. Semua gambar bermakna punya teks alternatif. Sketsa dekoratif disembunyikan dari pembaca layar.
4. Informasi penting tidak hanya disampaikan lewat animasi atau warna.
5. Uji dengan perbesaran 200 persen.
