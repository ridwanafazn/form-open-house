# ARCHITECTURE

Peta kode untuk developer. Ini bukan spesifikasi produk (lihat `docs/PRD.md` dan
`docs/TRD.md`), melainkan ringkasan "di mana logikanya berada" dan "apa yang harus
disentuh saat menambah fitur".

## 1. Ringkasan produk

Aplikasi pendaftaran peserta Open House SMKIT As-Syifa:

- Pengunjung melihat landing page, mengisi form 2 langkah, lalu mendapat tiket QR.
- Tiket dikirim otomatis lewat WhatsApp (Fonnte) dan bisa dibuka lagi lewat
  `/e-ticket/{kode}` atau `/cari-tiket`.
- Panitia memakai `/admin` untuk melihat pendaftar, mengubah tindak lanjut,
  memindai QR saat check-in, melihat rekap, mengekspor CSV, dan membuka/menutup
  pendaftaran.

## 2. Stack dan model runtime

| Bagian | Teknologi |
| --- | --- |
| Framework | Astro 7 (SSG untuk halaman publik, SSR untuk rute dinamis) |
| UI interaktif | React 19 islands (`@astrojs/react`) |
| Styling | CSS biasa + Tailwind utility (token di `src/styles/global.css`) |
| Database/Auth | Supabase (Postgres + Auth + RLS) |
| Hosting | Cloudflare Workers via `@astrojs/cloudflare` |
| WhatsApp | Fonnte API (server-side saja) |
| QR | `qrcode` (canvas di browser, SVG di server) |
| Peta | Leaflet + tile OpenStreetMap |
| Tes | Vitest (unit), Playwright (e2e) |

Halaman publik di-prerender. Hanya rute berikut yang berjalan di Worker
(`export const prerender = false`):

- `src/pages/api/*.ts`
- `src/pages/e-ticket/[code].astro`
- `src/pages/kelompok.astro`

## 3. Peta folder

```
src/
  config/
    event.ts        satu sumber fakta acara (tanggal, lokasi, WA, koordinat)
    groups.ts       rute kelompok dan sesi rotasi tour kampus
    content.ts      SEMUA teks yang tampil (Bahasa Indonesia)
  components/
    Hero.astro, StorySection.tsx, GuestHouse.astro, VisitorGuide.astro
    TourGuide.astro         matriks rotasi dan rute kelompok tour kampus
    GroupDirectory.tsx      daftar kelompok publik + pencarian dan cetak
    RegisterForm.tsx        form 2 langkah + countdown + honeypot
    TicketCard.tsx          tiket di /terima-kasih (baca sessionStorage)
    PublicTicket.tsx        tiket di /e-ticket/{code} (fetch /api/ticket)
    TicketFinder.tsx        pencarian tiket di /cari-tiket
    FloatingNav.astro       navbar publik, landing, dan admin
    admin/                  seluruh UI admin (React), termasuk ManualEntryTab
  layouts/Base.astro        <head>, font, Meta Pixel, capture UTM
  lib/
    validate.ts             validasi + normalisasi semua field form
    phone.ts                normalisasi nomor ke +628...
    utm.ts                  baca/simpan UTM di sessionStorage
    submitRegistration.ts   logika inti POST /api/register
    settings.ts             status buka/tutup + tenggat (fungsi murni + fetch)
    deadline.ts             konversi waktu WIB <-> ISO
    fonnte.ts               kirim WhatsApp
    csv.ts                  buat + unduh CSV admin
    groups.ts               pembagian kelompok deterministik + samarkan nama
    calendar.ts             URL Google Calendar
    supabaseClient.ts       klien Supabase untuk halaman admin saja
    placeholders.ts         deteksi teks [ISI: ...]
  pages/
    index.astro             landing + form + peta + rundown + footer
    terima-kasih.astro      halaman sukses
    cari-tiket.astro        pencarian tiket
    kelompok.astro          pembagian kelompok publik (SSR, noindex)
    e-ticket/[code].astro   tiket publik (SSR)
    privasi.astro
    admin.astro             shell admin (React client:only)
    api/                    endpoint server
  styles/
    global.css              token warna, font, utilitas publik
    admin.css               token dan komponen admin
supabase/migrations/        SQL skema (lihat catatan settings di bagian 8)
tests/unit, tests/e2e
docs/                       PRD, TRD, ERD, DESIGN, CONTENT, TASKS, PROGRESS
```

## 4. Rute dan endpoint

| Rute | Jenis | Keterangan |
| --- | --- | --- |
| `/` | statis | landing, form, peta, rundown, panduan, footer |
| `/terima-kasih` | statis | ringkasan + tiket dari `sessionStorage` |
| `/cari-tiket` | statis | cari tiket lewat kode atau nomor HP |
| `/kelompok` | SSR | pembagian kelompok tour kampus, nama disamarkan, `noindex` |
| `/privasi` | statis | kebijakan privasi |
| `/e-ticket/{code}` | SSR | tiket publik, data minimum |
| `/admin` | statis | island React, `noindex` |
| `POST /api/register` | SSR | simpan pendaftaran + kirim WA |
| `GET /api/ticket` | SSR | data tiket minimum untuk e-ticket |
| `POST /api/ticket-lookup` | SSR | cari tiket (kode/nomor), ada rate limit |
| `GET /api/ticket-image` | SSR | kartu tiket SVG untuk lampiran Fonnte |
| `GET /api/ticket-qr` | SSR | QR SVG lama (kompatibilitas) |
| `GET /api/registration-status` | SSR | status buka/tutup untuk form publik |

## 5. Alur utama

### 5.1 Pendaftaran

```
RegisterForm.tsx
  -> ambil status dari GET /api/registration-status
  -> validasi klien (validate.ts)
  -> POST /api/register
       -> submitRegistration.ts
          1. honeypot `website`
          2. baca status pendaftaran (settings.ts, service role)
          3. validateRegistration()
          4. generateTicketCode()
          5. POST {SUPABASE_URL}/rest/v1/registrations (service role)
          6. jika 409: ambil baris lama (parent_phone + child_name_key)
          7. kirim WhatsApp via Fonnte (gagal tidak membatalkan pendaftaran)
          8. balas { ok, id, ticket_code }
  -> simpan ringkasan ke sessionStorage `oh_summary`
  -> redirect /terima-kasih
```

Poin penting:

- `parent_name` dan `interest_major` sekarang **wajib** (berbeda dari PRD awal).
- Kode tiket: `OH-` + 6 karakter dari alfabet tanpa karakter ambigu.
- Konflik unik = pendaftaran dianggap sudah ada; server mengembalikan kode tiket
  yang benar-benar tersimpan agar tautan e-ticket tidak menjadi "hantu".

### 5.2 Tiket

- `/terima-kasih`: `TicketCard.tsx` membaca `sessionStorage.oh_summary`.
  Tiket tetap tampil dengan kode placeholder bila storage kosong.
- `/e-ticket/{code}`: `PublicTicket.tsx` memanggil `/api/ticket?code=...`.
  Endpoint hanya mengembalikan nama anak, jumlah hadir, kota, sekolah, kode.
- `/cari-tiket`: `TicketFinder.tsx` memanggil `/api/ticket-lookup` dengan kode
  atau nomor HP. Rate limit 20 permintaan/menit per IP per instance Worker.
- Gambar tiket untuk WhatsApp dibuat server-side oleh `/api/ticket-image`
  (SVG). Di browser, gambar PNG digambar manual di canvas (dua implementasi:
  `TicketCard.tsx` dan `PublicTicket.tsx`).

### 5.3 Admin

```
AdminApp.tsx
  -> LoginScreen (Supabase Auth email+password)
  -> cek baris di tabel `admins`
  -> ListScreen
       tab Daftar Peserta  : ringkasan + tabel + filter + CSV + pagination
       tab Scan Presensi   : ScannerTab (html5-qrcode / input manual)
       tab Rekap Acara     : RecapTab (statistik + donut + daftar)
       tab Tambah Manual   : ManualEntryTab (input kertas atau walk-in)
       DetailScreen        : ubah status, PIC, catatan, presensi, chat WA
  -> SettingsDialog (dibuka tombol gerigi di navbar)
```

Semua baca/tulis admin dilakukan **langsung dari browser** memakai
`@supabase/supabase-js` dan sesi admin. Otorisasi bergantung pada RLS, bukan pada
route API. Ini keputusan sadar (lihat `docs/QUESTIONS.md` Q11) karena sesi
Supabase disimpan di `localStorage`, bukan cookie.

`ListScreen` mengambil **semua** baris (`select('*')`) lalu memfilter,
menghitung ringkasan, dan memaginasi di klien (10 baris/halaman).

## 6. Konfigurasi

- Fakta acara: `src/config/event.ts` (ubah tanggal, jam, alamat, nomor WA,
  koordinat peta di sini).
- Semua copy: `src/config/content.ts`. Jangan menulis teks yang tampil langsung
  di komponen bila teks itu sudah punya tempat di `content.ts`.
- Env: `.env` lokal, `.env.example` sebagai daftar nama. Nilai server tidak
  boleh berawalan `PUBLIC_`.
- `scripts/check-placeholders.mjs` dijalankan `prebuild`; dengan
  `FAIL_ON_PLACEHOLDER=true` build gagal bila masih ada `[ISI:`.

## 7. Pola env di server (penting)

Jangan memakai `Astro.locals.runtime.env` — sudah dihapus di Astro 6+ dan
melempar exception. Pola yang dipakai semua endpoint:

```ts
import { env as workerEnv } from 'cloudflare:workers';

const runtimeEnv = (workerEnv ?? {}) as Record<string, string | undefined>;
const supabaseUrl =
  runtimeEnv.SUPABASE_URL || (import.meta.env.SUPABASE_URL as string | undefined) || '';
```

- `runtimeEnv` didahulukan agar secret dari dashboard Cloudflare terbaca saat
  runtime.
- `import.meta.env` hanya cadangan untuk `pnpm dev`; nilainya dibekukan Vite
  saat build, jadi jangan mengandalkannya untuk secret produksi.
- Baca env **di dalam handler request**, bukan di scope modul.
- Fungsi di `src/lib` menerima `env` dan `fetchImpl` sebagai parameter agar bisa
  diuji dan aman di workerd.

## 8. Database dan RLS

Tabel aplikasi: `registrations`, `admins`, dan `settings` (lihat ERD).

- `registrations`: satu baris per keluarga; kolom form + UTM + `ticket_code`
  + `attended_at` + kolom tindak lanjut + `source` (`online` atau `manual`).
- `admins`: `user_id` -> `auth.users`, penentu akses lewat `public.is_admin()`.
- `settings`: key/value jsonb, dipakai untuk `registration_open`
  (`open`, `message`, `deadline`, `forced`).

**Catatan penting:** `supabase/migrations/` saat ini hanya berisi `0001_init.sql`
dan `0002_attendance.sql`. Tabel `settings` + RLS-nya dibuat langsung di
database dan **belum punya berkas migrasi**. Jika database dibangun ulang dari
migrasi, panel pengaturan admin akan gagal memuat dan status pendaftaran
jatuh ke default "buka". Tambahkan migrasi `settings` sebelum mengandalkan
setup dari nol.

Aturan RLS: anon tidak punya akses ke tabel. Penulisan publik hanya lewat
endpoint server dengan service role key. Admin membaca, mengubah, menghapus,
dan menambah baris manual lewat RLS. Migrasi `0003_manual_entry.sql` menambah
`source`, membuat `parent_phone` boleh kosong, dan menambah policy insert admin.

## 9. Konvensi dan larangan

- Bahasa UI: Indonesia. Nama berkas, kode, dan commit: Inggris.
- Jangan menaruh service role key / token Fonnte di bundel browser.
- Jangan mencatat nama anak atau nomor HP ke log.
- Jangan menyimpan data pendaftar di `localStorage`; hanya ringkasan tiket dan
  UTM di `sessionStorage`.
- Desain matte: hindari gradient, shadow, blur, kaca, kilau (lihat
  `docs/DESIGN.md`). Beberapa komponen admin lama masih melanggar aturan ini.
- Jangan menambah paket di luar daftar TRD tanpa mencatat di
  `docs/QUESTIONS.md`.
- Hormati `prefers-reduced-motion`; animasi hanya `transform` dan `opacity`.
- Meta Pixel tidak boleh menerima nama, nomor, atau isi form.

## 10. Resep menambah/mengubah fitur

### Menambah field ke form pendaftaran

1. `supabase/migrations/` — tambah kolom (dan constraint bila perlu).
2. `src/lib/validate.ts` — tambah field ke `RegistrationInput`,
   `RegistrationValue`, validasi + normalisasi.
3. `src/lib/submitRegistration.ts` — masukkan ke `payload`.
4. `src/components/RegisterForm.tsx` — tambah state, input, `mapErrors`, dan
   masukkan ke payload.
5. `src/components/admin/types.ts` — tambah ke interface `Registration`.
6. `src/components/admin/DetailScreen.tsx` — tampilkan di detail.
7. `src/lib/csv.ts` + `ListScreen.handleExport` — tambah kolom CSV.
8. `src/config/content.ts` — label/helper/pesan error.
9. Tes: `tests/unit/registration.test.ts`, `submitRegistration.test.ts`, dan
   `tests/e2e/registration.spec.ts` bila alur UI berubah.

### Menambah tab/fitur admin

1. Tambah nilai `Tab` di `src/components/admin/types.ts`.
2. Buat komponen di `src/components/admin/`.
3. Daftarkan tombol tab + render di `ListScreen.tsx`.
4. Tambah tautan `#hash` di `FloatingNav.astro` bila perlu.
5. Gaya memakai token `--admin-*` di `src/styles/admin.css`.
6. Jika menulis ke tabel baru: aktifkan RLS + policy berbasis
   `public.is_admin()`, dan tambahkan migrasi SQL.

### Menambah endpoint server

1. Buat `src/pages/api/nama.ts` dengan `export const prerender = false`.
2. Baca env dengan pola bagian 7.
3. Taruh logika yang bisa diuji di `src/lib/` dan oper `env` + `fetchImpl`.
4. Jangan mengembalikan detail error internal ke klien.
5. Tambahkan `Cache-Control: private, no-store` untuk data pribadi.
6. Tambahkan CSP di `public/_headers` bila memanggil domain baru.

### Mengubah teks atau info acara

- Teks: `src/config/content.ts` (dan `docs/CONTENT.md`).
- Tanggal/jam/lokasi/WA/peta: `src/config/event.ts`.
- Teks yang masih memakai `[ISI:` harus dicatat di `docs/QUESTIONS.md`.

### Mengubah tampilan tiket

Ada dua tempat yang harus disamakan:

- `src/components/TicketCard.tsx` (halaman terima kasih, sumber data
  `sessionStorage`).
- `src/components/PublicTicket.tsx` (halaman e-ticket publik, sumber data API).
- Gambar SVG untuk Fonnte: `src/pages/api/ticket-image.ts`.

### Menambah halaman publik

1. Buat `src/pages/nama.astro` yang membungkus `Base.astro`.
2. Tambahkan teks ke `src/config/content.ts`.
3. Tambahkan tautan di `FloatingNav.astro` dan/atau footer `index.astro`.
4. Tambahkan ke `public/robots.txt` bila tidak boleh diindeks.

## 11. Perintah kerja

```sh
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm format
```

Urutan cek minimum sebelum menganggap selesai: `pnpm lint`, `pnpm test`,
`pnpm build`. Untuk perubahan UI/alur, jalankan juga `pnpm test:e2e`.

## 12. Hal yang perlu diketahui (tech debt)

Ditemukan saat pemetaan; belum diperbaiki.

1. **Migrasi `settings` tidak ada** — lihat bagian 8.
2. **Dokumen tertinggal dari kode**:
   - Turnstile sudah dihapus (T27), tetapi masih disebut di `docs/TRD.md`,
     `docs/LAUNCH.md`, dan `docs/SETUP.MD`.
   - `REGISTRATION_OPEN` di `.env.example` sudah tidak dipakai; status kini
     dari tabel `settings`.
   - `PUBLIC_META_PIXEL_ID` masih dicantumkan, tetapi Pixel di-hardcode di
     `Base.astro`.
   - `README.md` masih berupa template Astro.
   - PRD menyebut nama orang tua dan minat jurusan opsional, sedangkan kode
     mewajibkannya.
3. **Duplikasi render tiket** — `TicketCard.tsx` dan `PublicTicket.tsx`
   menggambar tiket dan menyusun pesan WA sendiri; format pesan keduanya sudah
   berbeda (emoji dan tautan grup). Satukan bila ingin konsisten.
4. **Duplikasi pesan WhatsApp** — teks di `submitRegistration.ts` dan
   `TicketCard.tsx` tidak lagi identik.
5. **`generateTicketCode()` memakai `Math.random()`** dan tidak menangani
   tabrakan kode acak secara khusus. Tabrakan pada `ticket_code` menghasilkan
   409; jalur 409 mencari baris berdasarkan nomor + nama. Bila yang bentrok
   adalah kode dengan pengguna lain, hasilnya bisa mengembalikan kode yang
   tidak tersimpan. Pertimbangkan retry saat insert konflik kode.
6. **Admin memuat semua baris ke browser** (`select('*')`) lalu memfilter dan
   memaginasi di klien. Akan melambat saat data besar; pindahkan filter,
   hitungan, dan pagination ke query Supabase bila perlu.
7. **Rate limit pencarian tiket hanya per instance** (`Map` di memori Worker).
   Tidak bertahan antar-instance dan tidak dibersihkan. Gunakan KV/Durable
   Object bila butuh batas yang kuat.
8. **`/api/ticket` dan `/api/ticket-image` tanpa rate limit**; kode tiket 6
   karakter dapat ditebak. Pertimbangkan pembatasan bila data dianggap sensitif.
9. **`ScannerTab.tsx` memakai `backdrop-filter: blur` dan `box-shadow`** di CSS
   inline, bertentangan dengan aturan desain matte. Juga memakai karakter
   dekoratif (✓, ✕, !, →).
10. **Meta Pixel dimuat di semua halaman**, termasuk `/admin`, dan event
    `Lead` dikirim di halaman terima kasih. Pastikan ini memang diinginkan.
11. **Font lebih dari dua keluarga** — selain DM Sans dan Space Grotesk,
    `global.css` memuat Oswald dan JetBrains Mono untuk hero/nav.
12. **`tests/unit/submitRegistration.test.ts`** memakai regex kode tiket
    `^OH-[2-9A-Z]{6}$` (lebih longgar dari pola sebenarnya), sehingga karakter
    ambigu bisa lolos tanpa terdeteksi.

## 13. Titik masuk yang sering dipakai

| Kebutuhan | Berkas |
| --- | --- |
| Ubah tanggal/jam/lokasi | `src/config/event.ts` |
| Ubah rute/sesi kelompok | `src/config/groups.ts` |
| Ubah teks apa pun | `src/config/content.ts` |
| Ubah validasi/normalisasi | `src/lib/validate.ts`, `src/lib/phone.ts` |
| Ubah alur simpan pendaftaran | `src/lib/submitRegistration.ts` |
| Ubah status buka/tutup | `src/lib/settings.ts`, `src/components/admin/SettingsDialog.tsx` |
| Ubah pesan WhatsApp | `src/lib/submitRegistration.ts`, `src/lib/fonnte.ts` |
| Ubah tampilan form | `src/components/RegisterForm.tsx` |
| Ubah halaman sukses | `src/pages/terima-kasih.astro`, `src/components/TicketCard.tsx` |
| Ubah tiket publik | `src/pages/e-ticket/[code].astro`, `src/components/PublicTicket.tsx` |
| Ubah admin | `src/components/AdminApp.tsx` + `src/components/admin/*` |
| Ubah gaya global | `src/styles/global.css`, `src/styles/admin.css` |
| Ubah header keamanan | `public/_headers`, `public/robots.txt` |
