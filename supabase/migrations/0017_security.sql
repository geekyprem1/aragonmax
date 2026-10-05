-- Security hardening:
-- 1) Credit RPCs: reject nonpositive amounts, execute revoked from clients.
-- 2) Templates: entitlement-aware RLS + safe metadata view for catalogs.
-- 3) Resources: section entitlements enforced by RLS.
-- 4) Branding: writes only through the backend route; value constraints.

-- ── 1. Credit RPCs ───────────────────────────────────────────
create or replace function public.decrement_words(p_user uuid, p_words bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining bigint;
begin
  if p_words is null or p_words <= 0 then
    raise exception 'decrement_words: amount must be positive' using errcode = '22023';
  end if;
  update public.profiles
     set words_remaining = greatest(words_remaining - p_words, 0)
   where id = p_user
  returning words_remaining into remaining;
  return remaining;
end;
$$;

create or replace function public.decrement_image_credits(p_user uuid, p_n bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare remaining bigint;
begin
  if p_n is null or p_n <= 0 then
    raise exception 'decrement_image_credits: amount must be positive' using errcode = '22023';
  end if;
  update public.profiles set image_credits = greatest(image_credits - p_n, 0)
  where id = p_user returning image_credits into remaining;
  return remaining;
end; $$;

create or replace function public.decrement_video_credits(p_user uuid, p_n bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare remaining bigint;
begin
  if p_n is null or p_n <= 0 then
    raise exception 'decrement_video_credits: amount must be positive' using errcode = '22023';
  end if;
  update public.profiles set video_credits = greatest(video_credits - p_n, 0)
  where id = p_user returning video_credits into remaining;
  return remaining;
end; $$;

revoke execute on function public.decrement_words(uuid, bigint) from public, anon, authenticated;
revoke execute on function public.decrement_image_credits(uuid, bigint) from public, anon, authenticated;
revoke execute on function public.decrement_video_credits(uuid, bigint) from public, anon, authenticated;

grant execute on function public.decrement_words(uuid, bigint) to service_role;
grant execute on function public.decrement_image_credits(uuid, bigint) to service_role;
grant execute on function public.decrement_video_credits(uuid, bigint) to service_role;

-- ── 2. Templates: tier-aware reads + metadata catalog ────────
drop policy if exists "templates_read_active" on public.templates;
create policy "templates_read_entitled" on public.templates
  for select using (
    public.is_admin()
    or (
      auth.uid() is not null
      and is_active
      and tier <= coalesce(
        (select p.template_level from public.profiles p where p.id = auth.uid()),
        0
      )
    )
  );

-- Public (any logged-in user) catalog metadata. No system_prompt here.
create or replace view public.template_catalog as
  select id, name, description, category, icon, tier
  from public.templates
  where is_active;

revoke all on public.template_catalog from anon, public;
grant select on public.template_catalog to authenticated, service_role;

-- ── 3. Resources: section entitlements ───────────────────────
-- One policy per section (permissive policies OR together); `section` refers
-- to this policy's own table, unqualified — always valid in a USING clause.
drop policy if exists "resources_read_authed" on public.resources;
drop policy if exists "resources_read_entitled" on public.resources;
drop policy if exists "resources_read_training" on public.resources;
drop policy if exists "resources_read_vip" on public.resources;
drop policy if exists "resources_read_reseller" on public.resources;

create policy "resources_read_training" on public.resources
  for select using (
    section = 'training'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and (p.feature_traffic or p.is_vip)
    )
  );

create policy "resources_read_vip" on public.resources
  for select using (
    section = 'vip'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_vip
    )
  );

create policy "resources_read_reseller" on public.resources
  for select using (
    section = 'reseller'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_reseller
    )
  );

-- ── 4. Branding hardening ────────────────────────────────────
-- Writes go through /api/branding (service role); direct client writes closed.
drop policy if exists "branding_write_own" on public.branding;

do $$ begin
  alter table public.branding
    add constraint branding_color_hex
    check (primary_color is null or primary_color ~ '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$');
exception when duplicate_object then null;
end $$;

-- One branded domain per customer (case-insensitive).
create unique index if not exists idx_branding_custom_domain
  on public.branding (lower(custom_domain))
  where custom_domain is not null;
