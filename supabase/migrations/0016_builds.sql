-- ── builds (Build page: idea → full product code) ──────────────
create table if not exists public.builds (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null default 'New build',
  type       text not null default 'website',
  model      text,
  idea       text,
  output     text,
  created_at timestamptz not null default now()
);

create index if not exists idx_builds_user on public.builds(user_id, created_at desc);

alter table public.builds enable row level security;

-- Users manage only their own builds; admins can read all.
create policy "builds_own" on public.builds
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "builds_admin_read" on public.builds
  for select using (public.is_admin());
