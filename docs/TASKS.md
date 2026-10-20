# TASKS

Kerjakan satu per satu, urut nomor. P1 wajib selesai untuk bisa tayang. P2 dikerjakan setelah semua P1 selesai. Setiap tugas punya hasil yang harus bisa dicek. Setelah selesai, ikuti langkah di `AGENTS.md`.

Hal yang dikerjakan manusia, bukan agent: membuat proyek Supabase dan Cloudflare Pages, membuat kunci Turnstile, menjalankan SQL, mengundang admin, mengisi teks pengganti di konfigurasi, menyediakan foto, dan menyetujui teks.

## T01 Kerangka proyek (P1)

Tujuan: proyek Astro jalan dengan React, adaptor Cloudflare, TypeScript ketat, dan alat uji.
Langkah:
1. Buat proyek Astro kosong di folder ini dengan pnpm. Tambahkan `@astrojs/react` dan `@astrojs/cloudflare`. Pakai paket sesuai daftar izin di `docs/TRD.md`.
2. Aktifkan TypeScript ketat. Siapkan eslint, prettier, vitest, dan playwright.
3. Buat struktur folder dari `AGENTS.md`.
4. Buat `.env.example` berisi nama variabel dari `docs/TRD.md`.
5. Buat `.gitignore` yang mengecualikan `.env`.
Cek: `pnpm build` dan `pnpm lint` lolos. Halaman kosong tampil di `pnpm dev`.

## T02 Token, font, dan kerangka tampilan (P1)

Tujuan: gaya dasar doff sesuai `docs/DESIGN.md`.
Langkah:
1. Tulis `src/styles/global.css` dengan token, reset sederhana, kertas berkotak dari CSS, tipografi, dan gaya fokus.
2. Pasang font dari Fontsource, host sendiri, dua keluarga saja.
3. Buat `src/layouts/Base.astro` dengan meta dari `docs/CONTENT.md`, bahasa `id`, viewport yang benar, dan favicon dari `public/images/logo.png`.
4. Buat komponen tombol, chip, dan isian bergaris bawah di `src/components/ui/`.
Cek: tidak ada `gradient`, `box-shadow`, `blur`, atau `backdrop-filter` di seluruh `src`. Cari dengan perintah pencarian teks dan hasilnya kosong.

## T03 Konfigurasi acara dan isi teks (P1)

Tujuan: satu sumber untuk fakta acara dan teks.
Langkah:
1. Buat `src/config/event.ts` persis seperti di `docs/TRD.md`.
2. Buat `src/config/content.ts` berisi semua teks dari `docs/CONTENT.md` sebagai objek, termasuk pesan kesalahan.
3. Tulis fungsi `findPlaceholders` yang mencari `[ISI:` di kedua berkas, dan skrip build yang gagal bila ada sisa dan `FAIL_ON_PLACEHOLDER=true`.
Cek: uji unit untuk `findPlaceholders` lolos.

## T04 Sketsa awal (P1)

Tujuan: delapan sketsa pertama dari `docs/DESIGN.md`, yaitu Dome, OpenBook, Laptop, Bezier, PaperPlane, Check, Tape, Underline.
Langkah: buat satu komponen per sketsa di `src/components/doodles/` sesuai aturan gambar. Buat halaman sementara `src/pages/_doodles.astro` yang menampilkan semuanya untuk dilihat.
Cek: tiap berkas di bawah 2 KB, tidak ada atribut `filter` atau `gradient`, dan halaman sementara tampil.

## T05 Hero (P1)

Tujuan: hero dengan animasi masuk CSS dan tombol daftar.
Langkah:
1. Buat `src/components/Hero.astro` dengan judul, kalimat pendukung, info singkat, dan tombol yang menuju bagian form dengan tautan jangkar.
2. Judul muncul per kata dengan CSS saja.
3. Sketsa Dome dan OpenBook di sisi hero, Laptop dan Bezier sebagai pasangan jurusan.
4. Tombol Daftar menempel di bawah layar HP setelah hero lewat, dan hilang saat bagian form terlihat. Boleh pakai `IntersectionObserver` dalam skrip kecil.
Cek: hero tampil penuh dengan JavaScript dimatikan. Hasil Lighthouse mobile LCP di bawah 2,5 detik.

## T06 Validasi dan nomor telepon (P1)

Tujuan: fungsi murni yang dipakai browser dan server.
Langkah:
1. Tulis `src/lib/phone.ts` dengan `normalizePhone` sesuai `docs/TRD.md`.
2. Tulis `src/lib/validate.ts` dengan `validateRegistration` yang mengembalikan `{ ok, errors, value }` sesuai aturan di TRD.
3. Tulis uji unit: minimal 12 contoh nomor dan satu uji untuk tiap aturan kolom.
Cek: `pnpm test` lolos.

## T07 Form dua langkah (P1)

Tujuan: island React untuk form sesuai `docs/DESIGN.md` bagian Form dan `docs/CONTENT.md`.
Langkah:
1. Buat `src/components/RegisterForm.tsx` dengan dua langkah, daftar tugas progres, chip, tombol kurang dan tambah untuk jumlah hadir, dan jebakan bot berupa isian tersembunyi bernama `website`.
2. Tambahkan widget Turnstile memakai skrip resmi Cloudflare yang dimuat saat langkah dua tampil.
3. Validasi di browser memakai fungsi dari T06. Tampilkan pesan dari `content.ts` dekat isian.
4. Saat kirim, ambil UTM dari sessionStorage (T09), tambahkan `device` dari lebar layar, lalu POST ke `/api/register`.
5. Jika berhasil, simpan ringkasan nama anak dan jumlah hadir di sessionStorage lalu pindah ke `/terima-kasih`.
6. Pasang island dengan `client:visible`.
Cek: uji e2e pada viewport HP dengan endpoint yang dipalsukan: nomor salah menampilkan pesan, isian benar berpindah halaman.

## T08 Database (P1)

Tujuan: migrasi siap dijalankan manusia.
Langkah: salin SQL dari `docs/ERD.md` ke `supabase/migrations/0001_init.sql`. Tulis `supabase/README.md` berisi langkah manusia: buat proyek di region Singapura, jalankan SQL, matikan pendaftaran Auth, undang admin, tambahkan ke tabel `admins`, dan tiga uji kebijakan akses.
Cek: berkas SQL identik dengan ERD. Tidak ada kunci rahasia di repo.

## T09 UTM (P1)

Langkah: tulis `src/lib/utm.ts` yang membaca parameter dari alamat dan menyimpannya di sessionStorage tanpa menimpa nilai lama, dan skrip kecil di `Base.astro` yang memanggilnya saat halaman dimuat. Tulis uji unit.
Cek: membuka `/?utm_source=instagram&utm_campaign=tes` lalu menelusuri halaman lain tetap menyimpan nilainya. Uji unit lolos.

## T10 Endpoint pendaftaran (P1)

Tujuan: `src/pages/api/register.ts` sesuai langkah di `docs/TRD.md`.
Langkah: tulis persis sembilan langkah di TRD. Pakai fetch ke REST Supabase, bukan pustaka. Jangan mencatat data pribadi ke log.
Cek: uji dengan fetch yang dipalsukan untuk kasus: sukses, isian jebakan terisi, nomor tidak valid, Turnstile gagal, konflik 409 dianggap sukses, kegagalan server, pendaftaran ditutup, isi terlalu besar.

## T11 Halaman terima kasih (P1)

Langkah:
1. Buat `src/pages/terima-kasih.astro` dan island kecil yang membaca ringkasan dari sessionStorage.
2. Tampilkan teks dari `content.ts`, tombol gabung WhatsApp sesuai `waJoinKind`, tombol kalender, tombol chat admisi, dan tautan PMB.
3. Tulis `src/lib/calendar.ts` yang menghasilkan berkas `.ics` di browser dari `eventConfig`. Tulis uji unit.
4. Animasi pesawat kertas dan centang digambar, dengan dukungan `prefers-reduced-motion`.
Cek: halaman tampil baik dengan dan tanpa ringkasan. Uji unit kalender lolos.

## T12 Admin (P1)

Tujuan: `src/pages/admin.astro` dengan island `AdminApp.tsx` sesuai bagian Admin di `docs/TRD.md`.
Langkah: login, pemeriksaan tabel `admins`, ringkasan, daftar dengan pencarian dan filter, detail dengan ubah status, catatan, dan penanggung jawab, tombol Chat WhatsApp, ekspor CSV, dan keluar. Tulis `src/lib/csv.ts` dengan perlindungan rumus dan uji unit. Pasang `noindex`.
Cek: uji unit CSV lolos. Bundel halaman utama tidak memuat Supabase. Periksa dengan melihat keluaran build.

## T13 Privasi, header, dan robots (P1)

Langkah: buat `/privasi` dari `docs/CONTENT.md`, `public/_headers` dengan header dan CSP di TRD, dan `public/robots.txt`.
Cek: form, Turnstile, dan admin tetap berfungsi dengan CSP aktif di pratinjau.

## T14 Bagian cerita (P2)

Langkah: buat bagian cerita empat adegan dari `docs/CONTENT.md` dengan sketsa, foto polaroid bila foto sudah ada di `public/images/`, dan gerak sesuai `docs/DESIGN.md`. Pakai `LazyMotion`. Dua adegan memakai `useScroll`.
Cek: dengan `prefers-reduced-motion` aktif semua tampil tanpa animasi. LCP dan CLS tetap sesuai anggaran.

## T15 Bagian insentif dan info acara (P2)

Langkah: buat dua bagian dari `docs/CONTENT.md`, termasuk tombol peta dan kalender.
Cek: tidak ada teks pengganti tersisa saat `FAIL_ON_PLACEHOLDER=true` dan konfigurasi sudah diisi.

## T16 Sketsa sisa dan polesan (P2)

Langkah: buat enam sketsa sisa, pembatas kertas sobek, dan pasang di bagian yang cocok. Hormati aturan doff.
Cek: pencarian teks untuk gradien, bayangan, dan blur di `src` masih kosong.

## T17 Pixel Meta (P2)

Langkah: muat skrip hanya jika `PUBLIC_META_PIXEL_ID` ada, setelah idle atau interaksi pertama. Kirim `PageView` dan `CompleteRegistration` di halaman terima kasih tanpa data pribadi.
Cek: tanpa variabel itu, tidak ada permintaan ke Meta sama sekali.

## T18 Uji akhir dan serah terima (P1 sebelum tayang)

Langkah:
1. Jalankan `pnpm lint`, `pnpm test`, dan `pnpm test:e2e`.
2. Jalankan Lighthouse mode mobile pada pratinjau dan catat angkanya di `docs/PROGRESS.md`.
3. Tulis `docs/LAUNCH.md` berisi daftar periksa manusia: teks pengganti sudah terisi, teks insentif dan privasi disetujui, kunci Turnstile produksi terpasang, akun admin kedua dari sekolah ada, uji kirim satu pendaftaran nyata lalu hapus, tautan UTM untuk bio dan iklan dibuat.
Cek: semua perintah lolos dan `docs/LAUNCH.md` ada.
