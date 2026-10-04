-- ArgonMax AI — schema (MVP)
-- Run in Supabase SQL editor in order (0001 -> 0004).

create extension if not exists "pgcrypto";

-- ── plans ────────────────────────────────────────────────
create table if not exists public.plans (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  monthly_words bigint not null default 0,
  price         numeric,
  purchase_url  text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ── profiles (1:1 with auth.users) ───────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  role            text not null default 'user' check (role in ('admin','user')),
  plan_id         uuid references public.plans(id) on delete set null,
  words_remaining bigint not null default 0,
  status          text not null default 'active' check (status in ('active','disabled')),
  created_at      timestamptz not null default now()
);

-- ── models (ArgonMax lineup, config-driven) ──────────────────
create table if not exists public.models (
  id           uuid primary key default gen_random_uuid(),
  model_key    text not null unique,
  display_name text not null,
  is_default   boolean not null default false,
  is_active    boolean not null default true,
  badge        text,
  sort_order   int not null default 0
);

-- ── templates / personas ─────────────────────────────────
create table if not exists public.templates (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  category      text not null check (category in ('expert','writing','coding')),
  icon          text,
  system_prompt text not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ── conversations ────────────────────────────────────────
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null default 'New chat',
  model      text not null,
  created_at timestamptz not null default now()
);

-- ── messages ─────────────────────────────────────────────
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            text not null check (role in ('user','assistant')),
  content         text not null,
  words_used      bigint not null default 0,
  created_at      timestamptz not null default now()
);

-- ── usage logs ───────────────────────────────────────────
create table if not exists public.usage_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  module     text not null check (module in ('chat','writer','code')),
  words_used bigint not null default 0,
  model      text not null,
  created_at timestamptz not null default now()
);

-- ── settings (key/value; API key, defaults) ──────────────
create table if not exists public.settings (
  key   text primary key,
  value text
);

-- ── favorites (user <-> template) ────────────────────────
create table if not exists public.favorites (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  template_id uuid not null references public.templates(id) on delete cascade,
  primary key (user_id, template_id)
);

create index if not exists idx_conversations_user on public.conversations(user_id);
create index if not exists idx_messages_conv on public.messages(conversation_id);
create index if not exists idx_usage_user on public.usage_logs(user_id);
