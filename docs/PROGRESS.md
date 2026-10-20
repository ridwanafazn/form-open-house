# PROGRESS

Tambahkan satu baris per tugas yang selesai, dengan format: nomor tugas, tanggal, hasil cek.

T01 | 2026-10-20 | `pnpm build` dan `pnpm lint` lolos. Halaman kosong tampil di `pnpm dev` (HTTP 200, judul benar). Struktur folder, `.env.example`, `.gitignore`, eslint, prettier, vitest, dan playwright sudah disiapkan.

T02 | 2026-10-20 | Pencarian teks untuk `gradient`, `box-shadow`, `blur`, dan `backdrop-filter` di seluruh `src` kosong. `pnpm build` dan `pnpm lint` lolos. Font Caveat Brush dan Public Sans ter-host sendiri (tanpa CDN eksternal), favicon dari `public/images/logo.png`, `Base.astro` ber-meta CONTENT.md, dan komponen tombol, chip, isian dibuat.

T03 | 2026-10-20 | Uji unit `placeholders.test.ts` lolos (6/6). `pnpm build` sukses dengan `prebuild` yang menjalankan `check-placeholders.mjs`. Dengan `FAIL_ON_PLACEHOLDER=true`, build gagal ketika masih ada `[ISI:`. Tersisa 1 placeholder di `event.ts` (`waJoinUrl`, tercatat di QUESTIONS Q01).

T04 | 2026-10-20 | 8 sketsa awal dibuat (Dome, OpenBook, Laptop, Bezier, PaperPlane, Check, Tape, Underline); tiap berkas di bawah 2 KB dan tanpa atribut `filter` atau `gradient`. Halaman pratinjau `src/pages/doodles.astro` tampil dan ikut di-build (2 halaman). Nama memakai `doodles`, bukan `_doodles`, karena Astro mengabaikan berkas berawalan garis bawah (tercatat di QUESTIONS Q03).

T05 | 2026-10-20 | `src/components/Hero.astro` dibuat (judul muncul per kata dengan CSS, sketsa Dome, OpenBook, Laptop, Bezier, tombol menuju `#form`) dan dipasang di `index.astro`. Tombol menempel di bawah layar HP memakai `IntersectionObserver` (hilang saat hero atau form terlihat). `pnpm build` (2 halaman) dan `pnpm lint` lolos.


