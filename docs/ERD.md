# ERD

Versi terbaru, menggantikan semua ERD sebelumnya. Hanya dua tabel milik aplikasi, ditambah tabel pengguna bawaan Supabase Auth.

## Tabel

1. `registrations`: satu baris untuk satu pendaftaran, yaitu satu calon siswa dan satu kontak orang tua. Anggota keluarga yang ikut hanya dihitung lewat `attendee_count`, namanya tidak disimpan.
2. `admins`: daftar akun yang boleh masuk ke area admin. Berisi `user_id` yang menunjuk ke `auth.users`.
3. `auth.users`: dikelola Supabase. Akun dibuat lewat undangan, bukan pendaftaran publik.

## Aturan penting

1. Satu pasangan nomor orang tua dan nama anak hanya boleh ada satu kali. Nama dibandingkan setelah dipangkas dan diubah ke huruf kecil lewat kolom turunan `child_name_key`.
2. Penulisan oleh publik hanya lewat endpoint server memakai service role key, yang melewati RLS. Peran anon tidak punya izin apa pun ke tabel.
3. Admin boleh membaca, mengubah, dan menghapus pendaftaran. Penghapusan dipakai untuk permintaan hapus data dari orang tua.
4. Masa simpan data belum ditentukan. Sampai ada keputusan sekolah, jangan menulis proses penghapusan otomatis.

## Isi berkas `supabase/migrations/0001_init.sql`

Salin persis ke berkas itu.

```sql
create extension if not exists pgcrypto;

create type public.major_interest as enum ('rpl', 'dkv', 'belum_tahu');

create type public.followup_status as enum (
  'belum_dihubungi',
  'sudah_dihubungi',
  'merespons',
  'tertarik',
  'tidak_jadi',
  'sudah_daftar_pmb'
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  child_name text not null check (char_length(child_name) between 2 and 100),
  child_name_key text generated always as (lower(btrim(child_name))) stored,
  parent_phone text not null check (parent_phone ~ '^\+628[0-9]{8,11}$'),
  parent_name text check (parent_name is null or char_length(parent_name) between 2 and 100),
  attendee_count smallint not null check (attendee_count between 1 and 10),
  city text not null check (char_length(city) between 2 and 80),
  school text not null check (char_length(school) between 2 and 120),
  interest_major public.major_interest,

  consent_wa boolean not null check (consent_wa = true),
  consent_at timestamptz not null default now(),

  utm_source text check (char_length(utm_source) <= 100),
  utm_medium text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 100),
  utm_content text check (char_length(utm_content) <= 100),
  utm_term text check (char_length(utm_term) <= 100),
  fbclid text check (char_length(fbclid) <= 300),
  referrer text check (char_length(referrer) <= 300),
  device text check (device in ('mobile', 'tablet', 'desktop')),

  assigned_to text check (char_length(assigned_to) <= 100),
  followup_status public.followup_status not null default 'belum_dihubungi',
  followup_note text check (char_length(followup_note) <= 1000),

  -- Tiket QR dan riwayat kehadiran
  ticket_code text unique check (ticket_code is null or ticket_code ~ '^OH-[2-9A-HJ-NP-Z]{6}$'),
  attended_at timestamptz,

  unique (parent_phone, child_name_key)
);

create index registrations_created_at_idx on public.registrations (created_at desc);
create index registrations_status_idx on public.registrations (followup_status);
create index registrations_assigned_idx on public.registrations (assigned_to);
create index registrations_attended_at_idx on public.registrations (attended_at);
create index registrations_ticket_code_idx on public.registrations (ticket_code);

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger registrations_updated_at
before update on public.registrations
for each row execute function public.set_updated_at();

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.is_admin() returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

alter table public.registrations enable row level security;
alter table public.admins enable row level security;

revoke all on public.registrations from anon;
revoke all on public.admins from anon;

create policy admins_read_registrations on public.registrations
  for select to authenticated using (public.is_admin());

create policy admins_update_registrations on public.registrations
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy admins_delete_registrations on public.registrations
  for delete to authenticated using (public.is_admin());

create policy admins_read_self on public.admins
  for select to authenticated using (user_id = auth.uid());
```

## Menambah admin pertama

Dikerjakan manusia, bukan agent.

1. Di dasbor Supabase, buka pengaturan Auth dan matikan pendaftaran pengguna baru.
2. Undang email admin lewat menu pengguna, lalu atur kata sandinya.
3. Salin `id` pengguna itu, lalu jalankan di SQL editor:

```sql
insert into public.admins (user_id) values ('ISI_ID_PENGGUNA');
```

## Pengujian kebijakan akses

Setelah migrasi, buktikan tiga hal dengan skrip kecil atau uji manual:

1. Permintaan dengan kunci anon yang membaca `registrations` mengembalikan kosong atau ditolak.
2. Permintaan dengan kunci anon yang menulis ke `registrations` ditolak.
3. Akun yang sudah login tetapi tidak ada di `admins` tidak bisa membaca `registrations`.

## Migrasi tambahan (0002_attendance.sql)

Untuk database yang sudah menjalankan `0001_init.sql`, jalankan migrasi berikut untuk menambahkan kolom QR tiket dan presensi kehadiran:

```sql
alter table public.registrations
  add column if not exists ticket_code text unique check (ticket_code is null or char_length(ticket_code) between 4 and 32),
  add column if not exists attended_at timestamptz;

create index if not exists registrations_attended_at_idx on public.registrations (attended_at);
create index if not exists registrations_ticket_code_idx on public.registrations (ticket_code);
```
