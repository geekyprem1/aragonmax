-- Phase D: resources for Training (OTO5), VIP (OTO10) and Reseller (OTO7).
-- Admin manages rows; users see them on gated pages based on entitlements.

create table if not exists public.resources (
  id          uuid primary key default gen_random_uuid(),
  section     text not null check (section in ('training','vip','reseller')),
  title       text not null,
  description text,
  url         text,
  type        text not null default 'link' check (type in ('video','pdf','link')),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.resources enable row level security;

-- Any logged-in user can read; page-level gating controls visibility.
create policy "resources_read_authed" on public.resources
  for select using (auth.uid() is not null);
create policy "resources_admin_all" on public.resources
  for all using (public.is_admin()) with check (public.is_admin());

-- Sample rows (edit/replace in Admin > Resources).
insert into public.resources (section, title, description, url, type, sort_order) values
  ('training', 'Getting Started with Traffic', 'Intro video on driving traffic to your AI outputs.', 'https://example.com/video1', 'video', 1),
  ('training', 'Free Traffic Playbook (PDF)', 'Step-by-step free traffic guide.', 'https://example.com/playbook.pdf', 'pdf', 2),
  ('vip', 'VIP Onboarding Call', 'Book your private setup session.', 'https://example.com/vip-call', 'link', 1),
  ('vip', 'VIP Live Training Replay', 'Recording of the latest VIP training.', 'https://example.com/vip-replay', 'video', 2),
  ('reseller', 'Reseller Sales Page Kit', 'Download the ready-made sales page and swipes.', 'https://example.com/reseller-kit.zip', 'link', 1),
  ('reseller', 'Reseller License Terms', 'Your reseller rights and terms.', 'https://example.com/reseller-license.pdf', 'pdf', 2)
on conflict do nothing;
