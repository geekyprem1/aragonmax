-- Enable RLS on all tables
alter table public.plans         enable row level security;
alter table public.profiles      enable row level security;
alter table public.models        enable row level security;
alter table public.templates     enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;
alter table public.usage_logs    enable row level security;
alter table public.settings      enable row level security;
alter table public.favorites     enable row level security;

-- ── plans ──────────────────────────────
create policy "plans_read_active" on public.plans
  for select using (is_active or public.is_admin());
create policy "plans_admin_all" on public.plans
  for all using (public.is_admin()) with check (public.is_admin());

-- ── profiles ───────────────────────────
create policy "profiles_read_own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());
-- Note: words_remaining changes happen via service role (bypasses RLS).

-- ── models ─────────────────────────────
create policy "models_read_active" on public.models
  for select using (is_active or public.is_admin());
create policy "models_admin_all" on public.models
  for all using (public.is_admin()) with check (public.is_admin());

-- ── templates ──────────────────────────
create policy "templates_read_active" on public.templates
  for select using (is_active or public.is_admin());
create policy "templates_admin_all" on public.templates
  for all using (public.is_admin()) with check (public.is_admin());

-- ── conversations ──────────────────────
create policy "conversations_own" on public.conversations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "conversations_admin_read" on public.conversations
  for select using (public.is_admin());

-- ── messages (via conversation ownership) ──
create policy "messages_own" on public.messages
  for all using (
    exists (select 1 from public.conversations c
            where c.id = conversation_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.conversations c
            where c.id = conversation_id and c.user_id = auth.uid())
  );
create policy "messages_admin_read" on public.messages
  for select using (public.is_admin());

-- ── usage_logs (read own; insert via service role) ──
create policy "usage_read_own" on public.usage_logs
  for select using (user_id = auth.uid() or public.is_admin());

-- ── settings (admin only) ──────────────
create policy "settings_admin_all" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ── favorites ──────────────────────────
create policy "favorites_own" on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
