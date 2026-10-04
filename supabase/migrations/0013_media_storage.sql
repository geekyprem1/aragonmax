-- Creative Studio: permanent storage + generation history.

-- Private storage bucket for generated media (served via our proxy only).
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

-- Generation history.
create table if not exists public.generations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  type         text not null check (type in ('image','video')),
  prompt       text,
  aspect_ratio text,
  storage_path text not null,
  content_type text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_generations_user on public.generations(user_id);

alter table public.generations enable row level security;

-- Users read their own generations; admin reads all. Inserts happen via service role.
create policy "generations_read_own" on public.generations
  for select using (user_id = auth.uid() or public.is_admin());
create policy "generations_delete_own" on public.generations
  for delete using (user_id = auth.uid() or public.is_admin());
