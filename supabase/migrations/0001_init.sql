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

  unique (parent_phone, child_name_key)
);

create index registrations_created_at_idx on public.registrations (created_at desc);
create index registrations_status_idx on public.registrations (followup_status);
create index registrations_assigned_idx on public.registrations (assigned_to);

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
