# Panduan Tayang (Launch Checklist) — Form Open House SMKIT As Syifa

Dokumen ini berisi daftar periksa manual yang harus diselesaikan oleh tim panitia / pemilik proyek sebelum situs diluncurkan ke publik di Cloudflare Pages.

---

## 1. Pengisian Data dan Konfigurasi Acara

Pastikan tidak ada teks pengganti tersisa sebelum build produksi. Uji dengan menjalankan perintah:
```bash
FAIL_ON_PLACEHOLDER=true pnpm build
```

- [ ] **Tautan WhatsApp Grup/Saluran (`src/config/event.ts`)**
  - Ganti nilai `waJoinUrl` dari `https://chat.whatsapp.com/[ISI: tautan grup]` menjadi tautan undangan grup atau saluran WhatsApp yang sebenarnya.
  - Pastikan jenisnya sesuai: `'group'` jika grup WhatsApp, atau `'channel'` jika saluran WhatsApp.
- [ ] **Nomor Kontak Admisi (`src/config/event.ts`)**
  - Pastikan `contactPhone` adalah nomor WhatsApp resmi admisi (format internasional tanpa tanda plus, misalnya `6281122223934`).
- [ ] **Alamat dan Tautan Google Maps (`src/config/event.ts`)**
  - Pastikan `mapsUrl` mengarah ke pin lokasi kampus SMKIT As Syifa Subang yang akurat.
- [ ] **Jadwal dan Tanggal Acara (`src/config/event.ts`)**
  - Pastikan tanggal, jam mulai, dan jam selesai sudah final.

---

## 2. Persetujuan Teks Resmi (Content Sign-off)

- [ ] **Teks Kebijakan Privasi (`docs/CONTENT.md` & `src/pages/privasi.astro`)**
  - Disetujui oleh penanggung jawab data / pimpinan sekolah mengenai perlakuan data pendaftar (hanya untuk keperluan open house dan PMB, tidak dijual/disebar).
- [ ] **Teks Insentif dan Biaya Pendaftaran Seleksi (`src/config/content.ts`)**
  - Nilai nominal insentif (contoh saat ini: Rp100 ribu saat open house vs Rp500 ribu normal) telah disetujui panitia PMB.

---

## 3. Akun dan Variabel Lingkungan di Cloudflare Pages

Atur environment variables berikut pada dashboard Cloudflare Pages (**Settings > Environment variables**):

| Nama Variabel | Tipe | Contoh / Keterangan |
|---|---|---|
| `PUBLIC_SITE_URL` | Plain text | URL produksi (mis. `https://openhouse.smkit-assyifa.sch.id` atau `https://*.pages.dev`) |
| `PUBLIC_TURNSTILE_SITE_KEY` | Plain text | Site key Cloudflare Turnstile resmi domain Anda |
| `TURNSTILE_SECRET_KEY` | Secret | Secret key Cloudflare Turnstile |
| `PUBLIC_SUPABASE_URL` | Plain text | URL endpoint proyek Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Plain text | Anon/Publishable key Supabase (aman untuk browser, dilindungi RLS) |
| `SUPABASE_URL` | Plain text | URL endpoint proyek Supabase untuk serverless function |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Service role key Supabase (**jangan sampai bocor/ter-expose ke publik**) |
| `REGISTRATION_OPEN` | Plain text | Set `true` untuk membuka pendaftaran, `false` untuk menutup |
| `FAIL_ON_PLACEHOLDER` | Plain text | Set `true` pada build produksi agar gagal jika masih ada placeholder |
| `PUBLIC_META_PIXEL_ID` | Plain text | *(Opsional)* ID Pixel Meta jika iklan berbayar dijalankan; kosongkan jika tidak |

- [ ] Buat widget Cloudflare Turnstile baru untuk domain publik yang digunakan (mode Managed).
- [ ] Masukkan `PUBLIC_TURNSTILE_SITE_KEY` dan `TURNSTILE_SECRET_KEY` produksi.
- [ ] Pastikan `SUPABASE_SERVICE_ROLE_KEY` hanya diatur sebagai Server Environment Variable, bukan build variable publik.

---

## 4. Basis Data Supabase & Akun Admin

- [ ] **Eksekusi Migrasi SQL**
  - Jalankan isi file `supabase/migrations/0001_init.sql` melalui SQL Editor di dashboard Supabase.
- [ ] **Matikan Pendaftaran Terbuka (Public Signups)**
  - Masuk ke dashboard Supabase: **Authentication > Providers > Email**.
  - Matikan opsi **Allow new users to sign up** agar publik tidak bisa mendaftar akun admin sembarangan.
- [ ] **Undang Akun Admin Resmi**
  - Melalui menu **Authentication > Users**, undang minimal **dua** email staf/panitia sekolah (`Invite user`).
  - Catat `UUID` pengguna yang dibuat.
- [ ] **Daftarkan Admin ke Tabel `admins`**
  - Buka Table Editor Supabase, masuk ke tabel `admins`.
  - Tambahkan baris baru untuk setiap UUID pengguna tadi, set kolom `role` menjadi `'admin'`.
- [ ] **Uji Akses Halaman Admin**
  - Kunjungi `/admin` di situs produksi.
  - Login dengan akun admin pertama dan kedua, pastikan halaman daftar dan tombol unduh CSV berfungsi.

---

## 5. Uji Coba Pendaftaran Nyata (Smoke Test)

Sebelum link disebar ke media sosial / broadcast:

- [ ] Buka situs produksi di ponsel/smartphone sungguhan.
- [ ] Lakukan pendaftaran dummy dengan data uji nyata (misal: "Test Panitia", nomor WhatsApp pribadi penguji).
- [ ] Pastikan widget Turnstile berhasil verifikasi.
- [ ] Pastikan langsung diarahkan ke halaman `/terima-kasih`.
- [ ] Klik tombol **Gabung WhatsApp**, pastikan link mengarahkan ke grup/channel WhatsApp yang benar.
- [ ] Masuk ke `/admin`, periksa apakah data pendaftar tadi masuk ke tabel.
- [ ] Klik tombol **Chat WhatsApp** di halaman detail admin untuk memverifikasi tautan pesan ke pendaftar.
- [ ] Hapus data dummy tersebut dari tabel Supabase agar kuota/rekap tetap bersih.

---

## 6. Persiapan Tautan Kampanye & UTM

Gunakan format URL berikut untuk pelacakan sumber pendaftar di admin:

- **Tautan Bio Instagram Utama:**
  `https://[domain-anda]/?utm_source=instagram&utm_medium=bio&utm_campaign=openhouse2026`
- **Tautan Iklan Instagram / Facebook Ads:**
  `https://[domain-anda]/?utm_source=meta_ads&utm_medium=cpc&utm_campaign=openhouse2026`
- **Tautan Broadcast WhatsApp:**
  `https://[domain-anda]/?utm_source=whatsapp&utm_medium=broadcast&utm_campaign=openhouse2026`
- **Tautan Brosur Fisik / Banner (QR Code):**
  `https://[domain-anda]/?utm_source=print&utm_medium=banner&utm_campaign=openhouse2026`
