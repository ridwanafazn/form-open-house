# QUESTIONS

Agent menulis di sini setiap kali memakai nilai bawaan, menemukan hal yang tidak jelas, atau butuh paket di luar daftar izin. Pemilik proyek menjawab di bawah tiap butir.

## Q01 waJoinUrl masih teks pengganti (2026-10-20)

`docs/TRD.md` baris 63 masih memuat `[ISI: tautan grup atau saluran WhatsApp]` untuk `waJoinUrl`. Nilai ini memicu kegagalan build saat `FAIL_ON_PLACEHOLDER=true` setelah T03 menyalin konfigurasi ke `src/config/event.ts`. Mohon isi tautan grup atau saluran WhatsApp open house. Sementara belum diisi, T01 hingga T08 berjalan tanpa tergantung nilai ini.

## Q02 prettier tidak memformat berkas .astro (2026-10-20)

Prettier bawaan tidak punya parser untuk `.astro`; biasanya ditangani `prettier-plugin-astro`. Plugin itu tidak ada dalam daftar izin di `docs/TRD.md`. Sesuai AGENTS.md butir 6, saya tidak menambah paket itu dan mengecualikan `src/**/*.astro` dari prettier lewat `.prettierignore`. Pemilik proyek boleh mengizinkan plugin ini jika ingin .astro ikut terformat.

## Q03 halaman pratinjau sketsa memakai nama `doodles.astro`, bukan `_doodles.astro` (2026-10-20)

T04 meminta halaman sementara bernama `src/pages/_doodles.astro`, tetapi Astro mengabaikan berkas di `src/pages` yang diawali garis bawah, sehingga halaman itu tidak ikut di-build. Agar pratinjau sketsa benar-benar tampil, berkas saya beri nama `src/pages/doodles.astro` (tanpa garis bawah). Halaman ini dihapus di tugas berikutnya setelah sketsa terpasang di hero.




