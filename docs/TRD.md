# TRD

Versi terbaru, menggantikan semua TRD sebelumnya.

## Teknologi

Paket yang diizinkan, selain itu tidak boleh ditambah tanpa izin:

1. `astro`, `@astrojs/react`, `@astrojs/cloudflare`
2. `react`, `react-dom`
3. `motion`, diimpor dari `motion/react`
4. `typescript`
5. `@supabase/supabase-js`, hanya dipakai di halaman admin
6. `@fontsource/caveat-brush` dan `@fontsource-variable/public-sans`. Jika salah satu tidak tersedia, pakai font sistem sebagai cadangan dan catat di `docs/QUESTIONS.md`.
7. `vitest`, `@playwright/test`, `eslint`, `prettier`

Tidak dipakai: Tailwind, pustaka komponen, pustaka ikon, pustaka validasi, pustaka tanggal. Gaya ditulis dengan CSS biasa dan variabel CSS.

Hosting: Cloudflare Pages. Halaman publik dibuat statis. Hanya `src/pages/api/register.ts` yang dijalankan di server, dengan `export const prerender = false`. Baca dokumentasi terbaru Astro dan adaptor Cloudflare untuk cara membaca variabel lingkungan di server.

## Rute

1. `/` halaman utama dan form.
2. `/terima-kasih` halaman sukses.
3. `/privasi` kebijakan privasi singkat.
4. `/admin` aplikasi admin. Satu halaman statis berisi island React yang hanya jalan di browser. Tidak diindeks mesin pencari.
5. `/api/register` endpoint POST untuk mengirim form.

## Variabel lingkungan

Isi `.env.example` dengan nama berikut tanpa nilai.

```
PUBLIC_SITE_URL=
PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
PUBLIC_META_PIXEL_ID=
REGISTRATION_OPEN=true
```

Catatan: `SUPABASE_SERVICE_ROLE_KEY` dan `TURNSTILE_SECRET_KEY` hanya untuk server. Untuk pengembangan lokal, Cloudflare menyediakan kunci uji Turnstile yang selalu lolos. Cek nilainya di dokumentasi Cloudflare sebelum dipakai.

## Konfigurasi acara

Berkas `src/config/event.ts` mengekspor satu objek dengan isi:

```ts
export const eventConfig = {
  name: 'Open House SMKIT As Syifa',
  dateText: 'Sabtu, 07 November 2026',
  dateISO: '2026-11-07',
  startTime: '08:00',
  endTime: '15:00',
  timezone: 'Asia/Jakarta',
  locationName: 'SMKIT As Syifa Boarding School, Jalancagak, Subang',
  locationAddress: 'KP. Kumpay RT/RW 06/02 Desa Kumpay, Kecamatan Jalancagak, Kabupaten Subang, Provinsi Jawa Barat 41281',
  mapsUrl: 'https://maps.app.goo.gl/DszrUCcGeJLJjudQA',
  admissionWhatsApp: '6281122223934',
  waJoinUrl: '[ISI: tautan grup atau saluran WhatsApp]',
  waJoinKind: 'group',
  pmbPortalUrl: 'https://registrasi.assyifa.sch.id/registrasi/login.php',
  registrationOpen: true,
}
```

Setiap nilai yang masih berbentuk teks pengganti harus terlihat jelas jika sampai tayang. Tambahkan pemeriksaan di langkah build yang gagal bila ada `[ISI:` tersisa dan variabel lingkungan `FAIL_ON_PLACEHOLDER=true`.

## Endpoint POST /api/register

Masukan JSON:

```json
{
  "child_name": "string",
  "parent_phone": "string",
  "parent_name": "string atau kosong",
  "attendee_count": 2,
  "city": "string",
  "school": "string",
  "interest_major": "rpl atau dkv atau belum_tahu atau kosong",
  "consent_wa": true,
  "turnstile_token": "string",
  "website": "",
  "utm_source": "", "utm_medium": "", "utm_campaign": "", "utm_content": "", "utm_term": "",
  "fbclid": "", "referrer": "", "device": "mobile atau tablet atau desktop"
}
```

Langkah di server, berurutan:

1. Tolak jika ukuran isi lebih dari 10 KB. Balas 413.
2. Jika `website` terisi, balas `{ "ok": true }` dengan status 200 tanpa menyimpan apa pun. Ini jebakan bot.
3. Jika `REGISTRATION_OPEN` bukan `true`, balas 403 dengan kode `closed`.
4. Validasi semua kolom dengan fungsi di `src/lib/validate.ts`. Jika gagal, balas 400 dengan `{ "ok": false, "errors": { "nama_kolom": "kode_kesalahan" } }`.
5. Verifikasi Turnstile dengan POST berbentuk form ke `https://challenges.cloudflare.com/turnstile/v0/siteverify` berisi `secret` dan `response`. Jika gagal, balas 403 dengan kode `turnstile`.
6. Simpan lewat fetch ke REST Supabase: `POST {SUPABASE_URL}/rest/v1/registrations` dengan header `apikey` dan `Authorization: Bearer` berisi service role key, `Content-Type: application/json`, dan `Prefer: return=minimal`.
7. Jika Supabase membalas konflik 409, anggap berhasil dan balas `{ "ok": true }`. Jangan beri tahu bahwa data sudah ada.
8. Jika gagal karena sebab lain, balas 500 dengan kode `server`. Jangan menyertakan rincian kesalahan. Catat hanya kode status ke log.
9. Jika berhasil, balas `{ "ok": true }`.

## Aturan validasi dan normalisasi

Semua teks dipangkas spasi di ujung dan spasi ganda dirapatkan.

1. `child_name`: 2 sampai 100 karakter.
2. `parent_phone`: normalisasi dengan langkah berikut. Buang semua karakter selain angka. Jika diawali `0`, ganti dengan `62`. Jika diawali `8`, tambahkan `62` di depan. Jika diawali `62`, biarkan. Tambahkan `+` di depan. Hasil harus cocok dengan pola `^\+628[0-9]{8,11}$`. Selain itu tolak dengan kode `phone`.
3. `parent_name`: kosong atau 2 sampai 100 karakter.
4. `attendee_count`: bilangan bulat 1 sampai 10.
5. `city`: 2 sampai 80 karakter.
6. `school`: 2 sampai 120 karakter.
7. `interest_major`: kosong, atau salah satu dari `rpl`, `dkv`, `belum_tahu`.
8. `consent_wa`: harus `true`.
9. Kolom UTM: maksimal 100 karakter. `fbclid` dan `referrer`: maksimal 300 karakter. `device`: salah satu dari `mobile`, `tablet`, `desktop`, selain itu kosongkan.

Fungsi normalisasi nomor ada di `src/lib/phone.ts` dan dipakai oleh browser maupun server. Tulis uji unit untuk minimal 12 contoh nomor, termasuk yang diawali 08, 628, +628, memakai spasi dan strip, terlalu pendek, terlalu panjang, dan bukan angka.

## Admin

Halaman admin adalah island React yang dimuat hanya di `/admin`. Island ini memakai `@supabase/supabase-js` dengan `PUBLIC_SUPABASE_ANON_KEY`. Keamanan data bergantung pada RLS di database, bukan pada kerahasiaan kunci anon.

Fitur:

1. Login dengan email dan kata sandi lewat Supabase Auth. Tidak ada tombol daftar.
2. Setelah login, cek apakah akun ada di tabel `admins`. Jika tidak, keluarkan dan tampilkan pesan bahwa akun tidak punya akses.
3. Mode Pemindai QR (Scan Presensi): memanfaatkan kamera perangkat (HTML5 Camera) untuk memindai QR Code tiket peserta di meja registrasi. Sistem mencocokkan ID/kode tiket dan mencatat waktu kehadiran (`attended_at = now()`) secara langsung ke Supabase.
4. Ringkasan di atas daftar: total pendaftar, total hadir (attended), total belum hadir (absent/no-show), total orang yang akan hadir (sum attendee_count), dan jumlah per sumber kunjungan.
5. Daftar pendaftar dengan pencarian nama anak atau nomor, filter status kehadiran (Semua, Sudah Hadir, Belum Hadir), filter status tindak lanjut, filter penanggung jawab.
6. Detail satu pendaftar: semua kolom, status kehadiran dan waktu check-in, ubah status tindak lanjut, catatan, nama penanggung jawab, tombol Chat WhatsApp.
7. Tombol Chat WhatsApp membuka `https://wa.me/{nomor tanpa plus}?text={pesan}` dengan pesan dari `docs/CONTENT.md`, diberi `encodeURIComponent`.
8. Ekspor CSV dari hasil filter yang sedang tampil. Buat CSV di browser. Kolom: waktu daftar, status kehadiran, waktu check-in, kode tiket, nama anak, nomor, nama orang tua, jumlah hadir, kota, sekolah, minat jurusan, sumber, kampanye, status, penanggung jawab, catatan. Lindungi dari injeksi rumus spreadsheet: jika sel diawali `=`, `+`, `-`, atau `@`, tambahkan tanda petik tunggal di depannya.
9. Tombol keluar.

## Tiket Masuk dan QR Code

1. Tidak memerlukan object storage eksternal (seperti Cloudinary). QR Code di-generate secara instan di browser/klien dalam bentuk SVG/Canvas berbasis ID pendaftaran / kode tiket unik.
2. Di halaman `/terima-kasih`, QR Code ditampilkan sebagai tiket digital dengan tombol simpan gambar dan tombol kirim ringkasan tiket ke WhatsApp pribadi.
3. Nilai QR Code memuat ID pendaftaran atau kode tiket ringkas yang dapat diverifikasi oleh scanner di halaman admin.

## Penangkapan UTM

Di halaman utama, saat pertama dimuat, baca parameter `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, dan `fbclid` dari alamat. Simpan di sessionStorage. Saat form dikirim, sertakan nilainya dan `document.referrer`. Jika parameter tidak ada, jangan menimpa nilai yang sudah tersimpan.

## Meta Pixel

Opsional. Hanya dimuat jika `PUBLIC_META_PIXEL_ID` ada. Dimuat setelah halaman idle atau setelah interaksi pertama, mana yang lebih dulu. Hanya mengirim event `PageView` dan `CompleteRegistration` di halaman terima kasih. Tidak boleh mengirim nama, nomor, atau data form apa pun.

## Keamanan

1. RLS aktif. Anon tidak punya izin apa pun ke tabel. Penulisan publik hanya lewat endpoint server dengan service role key.
2. Pendaftaran akun Supabase Auth dimatikan. Akun admin dibuat lewat undangan di dasbor, lalu ditambahkan ke tabel `admins`.
3. Berkas `public/_headers` memuat header: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` yang mengizinkan kamera untuk asal sendiri (`camera=(self), microphone=(), geolocation=()`) untuk fitur pemindai QR di admin, serta `Content-Security-Policy`. CSP mengizinkan skrip dari asal sendiri, `https://challenges.cloudflare.com` untuk Turnstile, `https://connect.facebook.net` bila Pixel aktif, frame Google Maps, dan koneksi ke `https://*.supabase.co`. Uji bahwa form, Turnstile, dan admin tetap jalan setelah CSP dipasang.
4. `public/robots.txt` melarang `/admin`, dan halaman admin memakai meta `noindex`.
5. Jangan menulis nomor telepon atau nama anak ke log.

## Anggaran performa

1. LCP kurang dari 2,5 detik, CLS kurang dari 0,1, INP kurang dari 200 ms, pada emulasi HP kelas menengah dengan 4G.
2. JavaScript halaman utama sekitar 150 KB terkompresi atau kurang. Supabase tidak boleh ada di bundel halaman utama.
3. Animasi masuk di hero memakai CSS, tidak menunggu React.
4. Gunakan `LazyMotion` dengan fitur `domAnimation` dan komponen `m`. Island hero memakai `client:load`, bagian lain `client:visible` atau `client:idle`.
5. Hanya animasikan `transform` dan `opacity`. Hormati `prefers-reduced-motion`.
6. Gambar memakai komponen gambar Astro, dengan lebar dan tinggi tertulis. Gambar hero memakai `fetchpriority="high"`, sisanya lazy.
7. Maksimal dua keluarga font dan dua bobot. Font di host sendiri dan di subset ke Latin.

## Pengujian

1. Uji unit dengan Vitest untuk `phone.ts`, `validate.ts`, `utm.ts`, dan `csv.ts`.
2. Uji e2e dengan Playwright pada viewport HP: buka halaman utama, isi form dua langkah, kirim, lihat halaman terima kasih. Gunakan stub untuk endpoint dan Turnstile.
3. Uji bahwa kirim form dengan nomor tidak valid menampilkan pesan yang benar dan tidak berpindah halaman.
4. Cek manual Lighthouse mode mobile sebelum tayang.

## Deploy

1. Buat proyek Cloudflare Pages dari repo. Perintah build: `pnpm build`. Isi variabel lingkungan di dasbor.
2. Proyek Supabase dibuat di region Singapura. Jalankan `supabase/migrations/0001_init.sql` di SQL editor.
3. Cabang `main` menjadi produksi. Setiap pull request mendapat pratinjau.
