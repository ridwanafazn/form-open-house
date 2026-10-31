# TRD

Versi terbaru, menggantikan semua TRD sebelumnya.

## Teknologi

Paket yang diizinkan, selain itu tidak boleh ditambah tanpa izin:

1. `astro`, `@astrojs/react`, `@astrojs/cloudflare`
2. `react`, `react-dom`
3. `motion`, diimpor dari `motion/react`
4. `typescript`
5. `@supabase/supabase-js`, hanya dipakai di halaman admin
6. Tidak ada paket font tambahan. DM Sans (isi) dan Space Grotesk (judul) di-host sendiri sebagai berkas woff2 di `public/fonts` dan dimuat lewat `@font-face` di `src/styles/global.css`, tanpa CDN.
7. `vitest`, `@playwright/test`, `eslint`, `prettier`
8. `tailwindcss`, `@tailwindcss/vite`

Tailwind CSS diizinkan untuk utilitas layout, spacing, responsive state, dan komponen visual. Gunakan kelas Tailwind secukupnya dengan token desain proyek. Jangan memakai gradient, shadow, blur, glossy effect, atau bentuk pil yang berlebihan. CSS biasa tetap boleh untuk animasi, SVG, dan aturan yang lebih mudah dirawat di komponen.

Tidak dipakai: pustaka komponen, pustaka ikon, pustaka validasi, pustaka tanggal.

Hosting: Cloudflare Workers melalui alur git-connected Workers Builds. Halaman publik dibuat statis dan disajikan lewat binding `ASSETS`; rute dinamis (`/api/register`, `/api/ticket`, `/api/ticket-image`, `/api/ticket-qr`, `/e-ticket/[code]`) dijalankan oleh Worker (`export const prerender = false`). Baca dokumentasi terbaru Astro dan adaptor Cloudflare untuk cara membaca variabel lingkungan di server.

Build memakai `pnpm run build`: adaptor Cloudflare menghasilkan `dist/client` untuk aset statis dan `dist/server` untuk modul Worker, lengkap dengan `dist/server/wrangler.json` berisi `main = "entry.mjs"`, binding `ASSETS` ke `../client`, serta compatibility settings dari `wrangler.toml`. Perintah deploy: `npx wrangler deploy --config dist/server/wrangler.json`. `wrangler.toml` di root adalah sumber compatibility settings (`name = "open-house"`, `compatibility_date = "2024-09-23"`, `compatibility_flags = ["nodejs_compat"]`); JANGAN menambah `pages_build_output_dir` ke file ini karena menandai project sebagai Pages dan wrangler menolak kombinasi `main` + `pages_build_output_dir`. Versi Node dikunci lewat `.nvmrc` dan `.node-version` berisi `22.22.0`. Flag `nodejs_compat` wajib ada karena bundel Worker memuat impor modul bawaan Node. `wrangler` dicantumkan sebagai devDependency (`4.151.2`) agar `npx wrangler` tersedia di environment build. Adaptor Cloudflare dijalankan dengan `prerenderEnvironment: 'node'`.

## Rute

1. `/` halaman utama dan form.
2. `/terima-kasih` halaman sukses.
3. `/privasi` kebijakan privasi singkat.
4. `/e-ticket/{ticket_code}` tiket digital publik yang dapat dibuka dari perangkat berbeda, hanya menampilkan data tiket minimum.
5. `/admin` aplikasi admin. Satu halaman statis berisi island React yang hanya jalan di browser. Tidak diindeks mesin pencari.
6. `/api/register` endpoint POST untuk mengirim form.
7. `/api/ticket` endpoint data tiket minimum untuk halaman e-ticket.
8. `/api/ticket-image` endpoint SVG kartu tiket publik sementara untuk lampiran Fonnte.
9. `/api/ticket-qr` endpoint SVG QR lama untuk kompatibilitas.

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
FONNTE_API_TOKEN=
REGISTRATION_OPEN=true
```

Catatan: `SUPABASE_SERVICE_ROLE_KEY` dan `TURNSTILE_SECRET_KEY` hanya untuk server. Untuk pengembangan lokal, Cloudflare menyediakan kunci uji Turnstile yang selalu lolos. Cek nilainya di dokumentasi Cloudflare sebelum dipakai.

Kunci uji Turnstile hanya boleh dipakai di localhost. Form dan endpoint menolak kunci uji di host lain: halaman menampilkan pesan `errors.turnstile_config` dan endpoint membalas `503` dengan kode `config`. Karena itu, isi `PUBLIC_TURNSTILE_SITE_KEY` dan `TURNSTILE_SECRET_KEY` dengan kunci asli di setiap environment Cloudflare (Production dan Preview) sebelum dipakai pendaftar. Pemeriksaan ini dilakukan saat runtime dari host permintaan, bukan saat build, agar `pnpm dev` dan `pnpm preview` di localhost tetap bisa memakai kunci uji.

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
5. Verifikasi Turnstile dengan POST berbentuk form ke `https://challenges.cloudflare.com/turnstile/v0/siteverify` berisi `secret` dan `response`. Jika gagal, balas 403 dengan kode `turnstile`. Jika `TURNSTILE_SECRET_KEY` tidak tersedia atau berisi kunci uji di host non-localhost, balas 503 dengan kode `config` tanpa menulis ke database.
6. Simpan lewat fetch ke REST Supabase: `POST {SUPABASE_URL}/rest/v1/registrations` dengan header `apikey` dan `Authorization: Bearer` berisi service role key, `Content-Type: application/json`, `Prefer: return=representation`, serta `ticket_code` unik.
7. Jika penyimpanan berhasil, server mencoba mengirim notifikasi WhatsApp melalui Fonnte ke nomor orang tua. Pesan berisi rekap tiket dan Fonnte mengambil SVG QR dari `/api/ticket-qr?code=OH-XXXXXX`. Kegagalan Fonnte tidak membatalkan pendaftaran; peserta tetap mendapat halaman terima kasih dan tiket QR.
8. Endpoint `/api/ticket-qr?code=OH-XXXXXX` menyediakan SVG QR tanpa menyimpan gambar di object storage. Endpoint hanya menerima format kode tiket yang valid dan mengirim `Cache-Control: private, no-store`.
9. Jika Supabase membalas konflik 409, anggap berhasil dan balas `{ "ok": true }`. Jangan beri tahu bahwa data sudah ada.
10. Jika gagal karena sebab lain, balas 500 dengan kode `server`. Jangan menyertakan rincian kesalahan. Jangan mencatat nomor telepon atau nama anak ke log.
11. Jika berhasil, balas `{ "ok": true, "id": "...", "ticket_code": "..." }`.

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

1. Tidak memerlukan object storage eksternal (seperti Cloudinary). QR Code dibuat di browser sebagai Canvas dan juga tersedia sebagai SVG sementara di endpoint server untuk lampiran Fonnte.
2. Di halaman `/terima-kasih`, QR Code ditampilkan sebagai tiket digital dengan tombol simpan gambar dan tombol bagikan file gambar + rekap teks melalui Web Share API; browser lama memakai fallback unduh gambar dan membuka WhatsApp dengan teks.
3. Nilai QR Code memuat kode tiket ringkas yang dapat diverifikasi oleh scanner di halaman admin.
4. Fonnte memakai `FONNTE_API_TOKEN` server-side. Token dikirim melalui header `Authorization`, tidak pernah dikirim ke browser atau dicatat ke log.

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
2. Uji e2e dengan Playwright pada viewport HP: buka halaman utama, isi form dua langkah, kirim, lihat halaman terima kasih. Gunakan stub untuk endpoint dan Turnstile. Ada juga skenario gagal muat pemeriksaan keamanan: script Turnstile diblokir, tombol kirim harus terkunci dan tombol muat ulang muncul.
3. Uji bahwa kirim form dengan nomor tidak valid menampilkan pesan yang benar dan tidak berpindah halaman.
4. Cek manual Lighthouse mode mobile sebelum tayang.

## Deploy

1. Hubungkan repo lewat alur Workers Builds (Workers & Pages > Create > Import a repository / Connect to Git). Build command: `pnpm run build`. Deploy command: `npx wrangler deploy --config dist/server/wrangler.json`. `wrangler` sudah menjadi devDependency sehingga `npx` menemukannya di node_modules.
2. Proyek Supabase dibuat di region Singapura. Jalankan `supabase/migrations/0001_init.sql` di SQL editor.
3. Cabang `main` menjadi produksi. Setiap pull request mendapat pratinjau versi.
4. Jalankan `pnpm build` lebih dulu sebelum `pnpm preview`. Script `prebuild` membersihkan `.wrangler`; build menulis ulang konfigurasi yang dipakai `astro preview`/miniflare (`dist/server/wrangler.json` dan cache `.wrangler`).
5. Setel semua environment variables di dashboard Cloudflare (Settings > Variables and Secrets), termasuk kunci Turnstile asli untuk Production dan Preview. Bila kunci uji terpasang di sana, form menampilkan pesan konfigurasi dan endpoint membalas `503 config`, bukan menerima pendaftaran tanpa pemeriksaan keamanan.
6. Binding yang dihasilkan adaptor (`SESSION` KV dan `IMAGES`) tercantum di `dist/server/wrangler.json`. Aplikasi ini tidak memakai Astro sessions maupun Image service, jadi binding itu tidak berpengaruh pada runtime; biarkan apa adanya agar deploy konsisten.
