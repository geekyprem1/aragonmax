-- Phase G: Whitelabel branding (OTO8).
-- A whitelabel owner customizes app name, logo and color for their own view
-- (and, later, their agency sub-accounts).

create table if not exists public.branding (
  owner_id      uuid primary key references public.profiles(id) on delete cascade,
  app_name      text,
  logo_url      text,
  primary_color text,
  custom_domain text,
  updated_at    timestamptz not null default now()
);

alter table public.branding enable row level security;

-- Owner can read/write their own branding.
-- (Sub-account "read parent branding" is added in 0010, after parent_id exists.)
create policy "branding_read" on public.branding
  for select using (owner_id = auth.uid() or public.is_admin());
create policy "branding_write_own" on public.branding
  for all using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
