# Setup Supabase

Langkah-langkah ini dikerjakan manusia (lihat `docs/SETUP.MD`). Agent tidak boleh
membuat atau mengubah akun serta proyek layanan tanpa perintah langsung pemilik.

## 1. Buat proyek

1. Buka dasbor Supabase dan buat proyek baru di region **Singapura**.
2. Catat URL proyek (berbentuk `https://ID_PROYEK.supabase.co`) dan kunci API
   (`sb_publishable_`/anon dan `sb_secret_`/service role).

## 2. Jalankan migrasi

1. Buka SQL Editor di dasbor proyek.
2. Jalankan seluruh isi `supabase/migrations/0001_init.sql`.
3. Skema tabel `registrations` dan `admins` dibuat, RLS diaktifkan untuk
   keduanya, dan peran anon tidak punya izin apa pun.

## 3. Matikan pendaftaran akun Auth

1. Buka Authentication > Providers (atau Settings > Auth) di dasbor.
2. Matikan pendaftaran pengguna baru (Sign ups / anonymous sign-ins).

## 4. Undang admin pertama

1. Buka Authentication > Users, lalu undang email admin.
2. Set kata sandi akun itu lewat menu pengguna.
3. Salin `id` (UUID) pengguna tersebut.

## 5. Tambahkan ke tabel admins

Di SQL Editor, jalankan dengan `id` dari langkah 4:

```sql
insert into public.admins (user_id) values ('ISI_ID_PENGGUNA');
```

## 6. Tigauji kebijakan akses

Buktikan tiga hal berikut di proyek:

1. Permintaan dengan kunci anon yang membaca `registrations` mengembalikan kosong
   atau ditolak.
2. Permintaan dengan kunci anon yang menulis ke `registrations` ditolak.
3. Akun yang sudah login tetapi tidak ada di `admins` tidak bisa membaca
   `registrations`.

Contoh pembacaan dengan anon:

```sh
curl -H "apikey: $PUBLIC_SUPABASE_ANON_KEY" \
     "$PUBLIC_SUPABASE_URL/rest/v1/registrations?select=*"
```

Kunci anon dipakai di sini hanya untuk menguji keamanan, dan tidak memberi akses
karena RLS aktif.

## Catatan

- Jangan menghubungkan MCP atau alat dengan izin menulis ke proyek produksi.
- Kunci rahasia tidak pernah ditulis di repo. Simpan di `.env` (tidak di commit)
  atau secret platform.
