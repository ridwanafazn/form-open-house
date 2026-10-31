# QUESTIONS

Q05 | 2026-10-22 | Fonnte token yang dipakai untuk mengirim pesan adalah device token yang disalin dari menu perangkat melalui aksi Token/API key, bukan account token. Format token tidak harus tepat 20 karakter; ikuti nilai token yang diberikan dashboard dan simpan hanya sebagai `FONNTE_API_TOKEN` server-side.


Agent menulis di sini setiap kali memakai nilai bawaan, menemukan hal yang tidak jelas, atau butuh paket di luar daftar izin. Pemilik proyek menjawab di bawah tiap butir.

## Q01 waJoinUrl masih teks pengganti (2026-10-20)

`docs/TRD.md` baris 63 masih memuat `[ISI: tautan grup atau saluran WhatsApp]` untuk `waJoinUrl`. Nilai ini memicu kegagalan build saat `FAIL_ON_PLACEHOLDER=true` setelah T03 menyalin konfigurasi ke `src/config/event.ts`. Mohon isi tautan grup atau saluran WhatsApp open house. Sementara belum diisi, T01 hingga T08 berjalan tanpa tergantung nilai ini.

## Q02 prettier tidak memformat berkas .astro (2026-10-20)

Prettier bawaan tidak punya parser untuk `.astro`; biasanya ditangani `prettier-plugin-astro`. Plugin itu tidak ada dalam daftar izin di `docs/TRD.md`. Sesuai AGENTS.md butir 6, saya tidak menambah paket itu dan mengecualikan `src/**/*.astro` dari prettier lewat `.prettierignore`. Pemilik proyek boleh mengizinkan plugin ini jika ingin .astro ikut terformat.

## Q07 paket `leaflet` untuk peta halaman utama (2026-10-24)

Atas permintaan langsung pemilik proyek ("sajikan maps lebih clean dan dewasa dengan leaflet js map"), iframe Google Maps di bagian info acara diganti peta Leaflet: paket `leaflet@1.9.4` (dan `@types/leaflet` sebagai devDependency) ditambahkan di luar daftar izin `docs/TRD.md`. Peta memakai tile OpenStreetMap, CSS Leaflet di-bundle lewat `import 'leaflet/dist/leaflet.css'`, dan CSP `img-src` diperluas dengan `https://*.tile.openstreetmap.org`. `frame-src` Google dihapus karena tidak ada lagi iframe. Peta diinisialisasi malas (IntersectionObserver) agar tidak membebani pemuatan awal.

## Q08 koordinat kampus untuk peta (2026-10-24)

`eventConfig.mapsLat = -6.660045` dan `mapsLng = 107.73521` diambil dari data tempat publik untuk alamat `Jalan Kumpay Kasomalang RT.006/RW.002, Kumpay, Jalancagak` — sama dengan alamat resmi di `eventConfig.locationAddress`. Mohon diverifikasi pemilik; bila pin kurang tepat, cukup ubah dua nilai ini di `src/config/event.ts`.


## Q03 halaman pratinjau sketsa memakai nama `doodles.astro`, bukan `_doodles.astro` (2026-10-20)

T04 meminta halaman sementara bernama `src/pages/_doodles.astro`, tetapi Astro mengabaikan berkas di `src/pages` yang diawali garis bawah, sehingga halaman itu tidak ikut di-build. Agar pratinjau sketsa benar-benar tampil, berkas saya beri nama `src/pages/doodles.astro` (tanpa garis bawah). Halaman ini dihapus di tugas berikutnya setelah sketsa terpasang di hero.

## Q04 font body diganti ke Plus Jakarta Sans (2026-10-20)

Atas permintaan langsung pemilik proyek, `@fontsource-variable/plus-jakarta-sans` dipakai sebagai font isi menggantikan `@fontsource-variable/public-sans`. Paket ini di luar daftar izin di `docs/TRD.md`, tetapi karena pemilik memintanya, saya pakai dan menegakkan pengecualian ini di sini. Font judul tetap Caveat Brush. `@fontsource-variable/public-sans` sudah dihapus dari dependensi. Cek performa T02 (font self-hosted, tanpa CDN) tetap dipenuhi.

## Q05 pasangan font diubah ke Plus Jakarta Sans (heading) × Lora (body) (2026-10-21)

Atas keputusan final pemilik proyek: Caveat Brush dihapus, `@fontsource/lora` ditambahkan. Peran: `--font-heading` → Plus Jakarta Sans Variable (sans-serif, tegas, w700), `--font-body` → Lora (serif, mudah dibaca untuk paragraf). Bobot heading diubah dari 400 ke 700 agar Plus Jakarta Sans tampak proporsional. Font self-hosted tanpa CDN tetap terpenuhi. Keputusan sketsa: semua doodle dihapus dari tampilan kecuali PaperPlane di halaman terima kasih.

## Q06 pasangan font diganti ke DM Sans × Space Grotesk (2026-10-24)

Atas permintaan pemilik proyek, kombinasi Fraunces × Plus Jakarta Sans dari rancangan awal diganti dengan kombinasi yang dipakai halaman admin: `--font-heading` → Space Grotesk, `--font-body` → DM Sans, berlaku untuk seluruh halaman (beranda, terima kasih, privasi, e-ticket, dan admin). Font tetap self-hosted tanpa CDN dan tanpa paket baru: empat berkas woff2 (latin + latin-ext untuk masing-masing keluarga) disimpan di `public/fonts` dan dimuat lewat `@font-face` di `src/styles/global.css`. Impor `@fontsource/fraunces` dan `@fontsource-variable/plus-jakarta-sans` dihapus dari `Base.astro`, kedua paket juga dihapus dari dependensi, sehingga CSP bisa kembali ketat (`font-src 'self' data:`, tanpa domain Google Fonts). Lisensi OFL kedua font disertakan di `public/fonts`.

## Q09 Fraunces kembali sebagai font display publik + keputusan referensi SMILE FEST (2026-10-24)

Pemilik proyek membawa referensi desain smile-festival.pages.dev (screenshot) dan meminta bahasa desain halaman publik mengikuti referensi itu, kecuali teks "Sustainable Muslim Living" (dianggap AI slop, tidak disalin). Keputusan yang disepakati: (1) matte penuh — tanpa bayangan, elemen melayang memakai border 1px ala navbar (opsi a); (2) Fraunces (self-hosted OFL, woff2 normal + italic di `public/fonts`) kembali sebagai `--font-display` untuk judul halaman publik dan brand navbar — Q06 di atas tetap berlaku untuk body (DM Sans) dan heading admin (Space Grotesk); (3) tombol primer publik menjadi pil gelap netral (`--ink`), tombol primer di footer gelap memakai varian emas; (4) halaman `/e-ticket` dan admin tetap memakai bahasa visual admin (slate), tidak diubah ke tema kertas — pemilik proyek belum memberi keberatan; ubah jika diminta.


## Q10 Meta Pixel (T17) hardcoded (2026-10-28)

Meta Pixel ID `1683289080083380` ditanam langsung di `Base.astro` (PageView semua halaman) dan `terima-kasih.astro` (event `Lead`). Spec T17 minta pakai `PUBLIC_META_PIXEL_ID` env var + conditional load + event `CompleteRegistration`, tapi pemilik memutuskan biarkan hardcoded dan anggap selesai. Tanpa data pribadi.


## Q11 Otorisasi tulis `settings` lewat RLS, bukan endpoint admin (2026-10-31)

Percobaan pertama (T54) memakai route `/api/admin/registration-status` untuk membaca/menulis `settings` dari server. Hasilnya selalu `401`: `@supabase/supabase-js` v2 menyimpan sesi di `localStorage` browser, bukan cookie, sehingga server tidak punya cara membaca sesi tanpa menambah paket `@supabase/ssr` (di luar daftar izin TRD).

Keputusan: baca/tulis `settings` dilakukan langsung dari browser memakai sesi admin yang sudah ada, dan otorisasinya diserahkan ke RLS `admins_read_settings` / `admins_write_settings` yang memanggil `public.is_admin()`. Ini pola yang sama dengan `ListScreen`/`DetailScreen` (query `registrations` langsung dari klien), jadi tidak ada jalur otorisasi kedua yang perlu dijaga. Route admin dihapus; hanya `GET /api/registration-status` (publik, service role di server) yang tersisa, karena halaman publik sengaja tidak memuat Supabase (aturan T12).




