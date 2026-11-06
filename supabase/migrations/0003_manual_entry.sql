-- Migrasi 0003: input pendaftar manual oleh panitia.
-- Online registrations keep phone as a required field in the application layer,
-- but the database allows NULL so manual entries without a phone number can be
-- recorded from paper forms.

alter table public.registrations
  add column if not exists source text not null default 'online';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'registrations_source_check'
      and conrelid = 'public.registrations'::regclass
  ) then
    alter table public.registrations
      add constraint registrations_source_check
      check (source in ('online', 'manual'));
  end if;
end;
$$;

alter table public.registrations
  alter column parent_phone drop not null;

create index if not exists registrations_source_idx
  on public.registrations (source);

drop policy if exists admins_insert_registrations on public.registrations;

create policy admins_insert_registrations on public.registrations
  for insert to authenticated
  with check (public.is_admin());
