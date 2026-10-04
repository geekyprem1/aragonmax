-- Phase H: Agency sub-accounts (OTO6) + Team seats (OTO9).
-- A parent account manages child accounts (clients or team members).

alter table public.profiles
  add column if not exists parent_id uuid references public.profiles(id) on delete set null,
  add column if not exists is_sub_admin boolean not null default false,
  add column if not exists member_type text check (member_type in ('agency','team'));

create index if not exists idx_profiles_parent on public.profiles(parent_id);

-- Parent can read its child profiles (for the manager pages).
create policy "profiles_read_children" on public.profiles
  for select using (parent_id = auth.uid());

-- Now that parent_id exists, let sub-accounts read their parent's branding.
drop policy if exists "branding_read" on public.branding;
create policy "branding_read" on public.branding
  for select using (
    owner_id = auth.uid()
    or owner_id = (select parent_id from public.profiles where id = auth.uid())
    or public.is_admin()
  );
