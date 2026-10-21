# PROGRESS

Tambahkan satu baris per tugas yang selesai, dengan format: nomor tugas, tanggal, hasil cek.

T01 | 2026-10-20 | `pnpm build` dan `pnpm lint` lolos. Halaman kosong tampil di `pnpm dev` (HTTP 200, judul benar). Struktur folder, `.env.example`, `.gitignore`, eslint, prettier, vitest, dan playwright sudah disiapkan.

T02 | 2026-10-20 | Pencarian teks untuk `gradient`, `box-shadow`, `blur`, dan `backdrop-filter` di seluruh `src` kosong. `pnpm build` dan `pnpm lint` lolos. Font Caveat Brush dan Public Sans ter-host sendiri (tanpa CDN eksternal), favicon dari `public/images/logo.png`, `Base.astro` ber-meta CONTENT.md, dan komponen tombol, chip, isian dibuat.

T03 | 2026-10-20 | Uji unit `placeholders.test.ts` lolos (6/6). `pnpm build` sukses dengan `prebuild` yang menjalankan `check-placeholders.mjs`. Dengan `FAIL_ON_PLACEHOLDER=true`, build gagal ketika masih ada `[ISI:`. Tersisa 1 placeholder di `event.ts` (`waJoinUrl`, tercatat di QUESTIONS Q01).

T04 | 2026-10-20 | 8 sketsa awal dibuat (Dome, OpenBook, Laptop, Bezier, PaperPlane, Check, Tape, Underline); tiap berkas di bawah 2 KB dan tanpa atribut `filter` atau `gradient`. Halaman pratinjau `src/pages/doodles.astro` tampil dan ikut di-build (2 halaman). Nama memakai `doodles`, bukan `_doodles`, karena Astro mengabaikan berkas berawalan garis bawah (tercatat di QUESTIONS Q03).

T05 | 2026-10-20 | `src/components/Hero.astro` dibuat (judul muncul per kata dengan CSS, sketsa Dome, OpenBook, Laptop, Bezier, tombol menuju `#form`) dan dipasang di `index.astro`. Tombol menempel di bawah layar HP memakai `IntersectionObserver` (hilang saat hero atau form terlihat). `pnpm build` (2 halaman) dan `pnpm lint` lolos.

T06 | 2026-10-20 | `src/lib/phone.ts` (normalisasi + validasi nomor 62 8 diikuti 8-11 digit) dan `src/lib/validate.ts` (`validateRegistration` mengembalikan `{ ok, errors, value }`) dibuat. `pnpm test` lolos 27/27, termasuk 13 contoh nomor dan satu uji per aturan kolom.

T07 | 2026-10-20 | `src/components/RegisterForm.tsx` (form dua langkah React dengan LazyMotion, chip jurusan, stepper jumlah hadir, jebakan bot `website`, Turnstile, ambil UTM dari sessionStorage, dan simpan ringkasan) dipasang di `index.astro` dengan `client:visible`. Diverifikasi di browser viewport HP: langkah 1 tampil, tombol Lanjut memindah ke langkah 2 dengan tombol Kirim pendaftaran. `src/lib/utm.ts` dibuat sebagai dasar T09. `pnpm build` (2 halaman) dan `pnpm lint` lolos; `pnpm test` 27/27.

T08 | 2026-10-20 | `supabase/migrations/0001_init.sql` dibuat, identik byte-demi-byte dengan blok SQL di `docs/ERD.md`. `supabase/README.md` berisi langkah manusia (buat proyek, jalankan SQL, matikan pendaftaran Auth, undang admin, tambah ke tabel admins, tiga uji kebijakan). Tidak ada kunci rahasia ter-commit (`.env` tidak ter-stage).

T09 | 2026-10-20 | `utm.ts` lengkap dengan uji unit (5 uji: baca URL, ambil tersimpan, simpan baru, tidak menimpa, gabungan). Skrip `is:inline` di `Base.astro` menangkap UTM/fbclid ke sessionStorage saat halaman dimuat. Diverifikasi di browser: `/?utm_source=instagram&utm_campaign=tes` tersimpan dan bertahan setelah navigasi ke `/terima-kasih`. `pnpm test` lolos.

T10 | 2026-10-20 | `src/pages/api/register.ts` (route tipis, `prerender=false`) meneruskan ke `src/lib/submitRegistration.ts` yang memuat 9 langkah TRD (batas 10 KB, jebakan bot, cek REGISTRATION_OPEN, validasi, Turnstile, tulis Supabase dengan service role key, konflik 409 jadi sukses, gagal server 500 tanpa rincian, sukses). Uji unit 10 kasus dengan fetch tiruan; `pnpm test` 45/45.

T11 | 2026-10-20 | `src/lib/calendar.ts` (bangun `.ics` di browser) + uji unit. Halaman `terima-kasih.astro` dengan island ringkasan sessionStorage, tombol gabung WhatsApp sesuai `waJoinKind`, kalender (klien), chat admisi, dan tautan PMB. `pnpm build` sukses (3 halaman: index, doodles, terima-kasih); `pnpm test` 45/45; `pnpm lint` lolos.

T12 | 2026-10-21 | `src/lib/csv.ts` (buildCsv, escapeCell, downloadCsv, proteksi formula injection) + uji unit 20 kasus (65/65 total). `src/pages/admin.astro` (noindex, client:only). `src/components/AdminApp.tsx` (login, cek admins, ringkasan, daftar+filter+cari, detail, ubah status/catatan/PJ, Chat WhatsApp, ekspor CSV). Bundel halaman utama tidak memuat Supabase (verifikasi lewat grep pada dist). `pnpm build`, `pnpm lint`, `pnpm test` 65/65 lolos.

T13 | 2026-10-20 | Halaman `/privasi` dibuat dari `docs/CONTENT.md`, `public/_headers` memuat header keamanan dan CSP sesuai TRD, `public/robots.txt` memblokir `/admin`. `pnpm build` sukses (halaman privasi ikut di-build), `pnpm lint` dan `pnpm test` 45/45 lolos. Uji manual form dan Turnstile dengan CSP aktif pada pratinjau belum bisa dituntaskan penuh sampai halaman admin (T12) dan pengaturan kunci Turnstile riil selesai.

T15 | 2026-10-20 | Bagian insentif dan info acara ditambahkan di `index.astro` (judul insentif, isi, catatan kecil; dan info hari/tanggal, jam, tempat, alamat, tombol Buka peta, catatan susunan acara). Hero dirampingkan ke flat: judul, kalimat pendukung, info, tombol — hiasan sketsa berlebih dihapus. `pnpm build` sukses, `pnpm lint` dan `pnpm test` 45/45 lolos. Cek doff (gradient, box-shadow, backdrop-filter) bersih.

Font isi | 2026-10-20 | Font body diganti ke Plus Jakarta Sans (`@fontsource-variable/plus-jakarta-sans`) atas permintaan pemilik; `@fontsource-variable/public-sans` dihapus. Tercatat di QUESTIONS Q04. Font self-hosted tanpa CDN tetap.

Font heading+body | 2026-10-21 | Caveat Brush dihapus. Pasangan final: Plus Jakarta Sans Variable (heading, w700) × Lora (body, serif). `@fontsource/caveat-brush` dihapus, `@fontsource/lora` ditambahkan. Cek bersih: tidak ada `caveat` di `src/`. `pnpm build`, `pnpm lint`, `pnpm test` 45/45 lolos. `_headers` dibersihkan dari baris `*/` yang memicu warning build. Tercatat di QUESTIONS Q05.
