# QUESTIONS

Q05 | 2026-10-22 | Fonnte token yang dipakai untuk mengirim pesan adalah device token yang disalin dari menu perangkat melalui aksi Token/API key, bukan account token. Format token tidak harus tepat 20 karakter; ikuti nilai token yang diberikan dashboard dan simpan hanya sebagai `FONNTE_API_TOKEN` server-side.


Agent menulis di sini setiap kali memakai nilai bawaan, menemukan hal yang tidak jelas, atau butuh paket di luar daftar izin. Pemilik proyek menjawab di bawah tiap butir.

## Q01 waJoinUrl masih teks pengganti (2026-10-20)

`docs/TRD.md` baris 63 masih memuat `[ISI: tautan grup atau saluran WhatsApp]` untuk `waJoinUrl`. Nilai ini memicu kegagalan build saat `FAIL_ON_PLACEHOLDER=true` setelah T03 menyalin konfigurasi ke `src/config/event.ts`. Mohon isi tautan grup atau saluran WhatsApp open house. Sementara belum diisi, T01 hingga T08 berjalan tanpa tergantung nilai ini.

## Q02 prettier tidak memformat berkas .astro (2026-10-20)

Prettier bawaan tidak punya parser untuk `.astro`; biasanya ditangani `prettier-plugin-astro`. Plugin itu tidak ada dalam daftar izin di `docs/TRD.md`. Sesuai AGENTS.md butir 6, saya tidak menambah paket itu dan mengecualikan `src/**/*.astro` dari prettier lewat `.prettierignore`. Pemilik proyek boleh mengizinkan plugin ini jika ingin .astro ikut terformat.

## Q03 halaman pratinjau sketsa memakai nama `doodles.astro`, bukan `_doodles.astro` (2026-10-20)

T04 meminta halaman sementara bernama `src/pages/_doodles.astro`, tetapi Astro mengabaikan berkas di `src/pages` yang diawali garis bawah, sehingga halaman itu tidak ikut di-build. Agar pratinjau sketsa benar-benar tampil, berkas saya beri nama `src/pages/doodles.astro` (tanpa garis bawah). Halaman ini dihapus di tugas berikutnya setelah sketsa terpasang di hero.

## Q04 font body diganti ke Plus Jakarta Sans (2026-10-20)

Atas permintaan langsung pemilik proyek, `@fontsource-variable/plus-jakarta-sans` dipakai sebagai font isi menggantikan `@fontsource-variable/public-sans`. Paket ini di luar daftar izin di `docs/TRD.md`, tetapi karena pemilik memintanya, saya pakai dan menegakkan pengecualian ini di sini. Font judul tetap Caveat Brush. `@fontsource-variable/public-sans` sudah dihapus dari dependensi. Cek performa T02 (font self-hosted, tanpa CDN) tetap dipenuhi.

## Q05 pasangan font diubah ke Plus Jakarta Sans (heading) × Lora (body) (2026-10-21)

Atas keputusan final pemilik proyek: Caveat Brush dihapus, `@fontsource/lora` ditambahkan. Peran: `--font-heading` → Plus Jakarta Sans Variable (sans-serif, tegas, w700), `--font-body` → Lora (serif, mudah dibaca untuk paragraf). Bobot heading diubah dari 400 ke 700 agar Plus Jakarta Sans tampak proporsional. Font self-hosted tanpa CDN tetap terpenuhi. Keputusan sketsa: semua doodle dihapus dari tampilan kecuali PaperPlane di halaman terima kasih.

## Q06 pasangan font diganti ke DM Sans × Space Grotesk (2026-10-24)

Atas permintaan pemilik proyek, kombinasi Fraunces × Plus Jakarta Sans dari rancangan awal diganti dengan kombinasi yang dipakai halaman admin: `--font-heading` → Space Grotesk, `--font-body` → DM Sans, berlaku untuk seluruh halaman (beranda, terima kasih, privasi, e-ticket, dan admin). Font tetap self-hosted tanpa CDN dan tanpa paket baru: empat berkas woff2 (latin + latin-ext untuk masing-masing keluarga) disimpan di `public/fonts` dan dimuat lewat `@font-face` di `src/styles/global.css`. Impor `@fontsource/fraunces` dan `@fontsource-variable/plus-jakarta-sans` dihapus dari `Base.astro`, kedua paket juga dihapus dari dependensi, sehingga CSP bisa kembali ketat (`font-src 'self' data:`, tanpa domain Google Fonts). Lisensi OFL kedua font disertakan di `public/fonts`.




