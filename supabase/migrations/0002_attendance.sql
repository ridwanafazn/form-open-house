-- Migrasi 0002: Penambahan kode tiket unik dan pencatatan presensi kehadiran
alter table public.registrations
  add column if not exists ticket_code text unique check (ticket_code is null or char_length(ticket_code) between 4 and 32),
  add column if not exists attended_at timestamptz;

create index if not exists registrations_attended_at_idx on public.registrations (attended_at);
create index if not exists registrations_ticket_code_idx on public.registrations (ticket_code);
