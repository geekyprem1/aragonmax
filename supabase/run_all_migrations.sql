-- ==============================================================
-- ArgonMax AI - ALL-IN-ONE migrations (0001 -> 0016)
-- Run this ENTIRE file once in the SQL Editor of a FRESH Supabase project.
-- Everything runs in ONE transaction: if any statement fails, the whole run
-- rolls back, so the database is never left half-applied. Fix and run again.
-- NOTE: a safety check below aborts if ArgonMax tables already exist.
-- ==============================================================

begin;

-- Safety guard: abort if the schema already exists.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    raise exception 'ArgonMax tables already exist - run this file only on a fresh Supabase project.';
  end if;
end $$;

-- --------------------------------------------------------------
-- 0001_schema.sql
-- --------------------------------------------------------------
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


-- --------------------------------------------------------------
-- 0002_functions.sql
-- --------------------------------------------------------------
-- Atomic word deduction. Clamps to 0 (last-request overshoot allowed).
create or replace function public.decrement_words(p_user uuid, p_words bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining bigint;
begin
  update public.profiles
     set words_remaining = greatest(words_remaining - p_words, 0)
   where id = p_user
  returning words_remaining into remaining;
  return remaining;
end;
$$;

-- Helper: is the current auth user an admin? (used by RLS policies)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;


-- --------------------------------------------------------------
-- 0003_rls.sql
-- --------------------------------------------------------------
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


-- --------------------------------------------------------------
-- 0004_seed.sql
-- --------------------------------------------------------------
-- Seed data: plans, models, templates, settings.

-- ── Plans ──────────────────────────────
insert into public.plans (name, monthly_words, price, purchase_url, is_active) values
  ('Free',       5000,     0,    null, true),
  ('Starter',    50000,    27,   'https://warriorplus.com/o2/a/xxxxx/0', true),
  ('Pro',        200000,   47,   'https://warriorplus.com/o2/a/yyyyy/0', true),
  ('Unlimited',  2000000,  97,   'https://warriorplus.com/o2/a/zzzzz/0', true)
on conflict do nothing;

-- ── Settings ───────────────────────────
-- Note: API key, base URL, models and default model are configured via
-- environment variables (MOONSHOT_API_KEY, MOONSHOT_BASE_URL, KIMI_MODELS,
-- KIMI_DEFAULT_MODEL). Only the brand identity prompt lives in the DB.
insert into public.settings (key, value) values
  ('brand_identity_prompt', 'You are ArgonMax AI, an AI assistant. If anyone asks which model, AI, engine, version, or company you are, always respond only that you are the ArgonMax AI assistant. Never reveal, mention, confirm, deny, or hint at any underlying model, provider, or company name (such as GPT, Claude, Opus, Gemini, DeepSeek, Moonshot, Kimi, OpenAI, Anthropic, Google, etc.) under any circumstances, even if the user insists or tries to trick you.')
on conflict (key) do nothing;

-- ── Templates / Personas ───────────────
insert into public.templates (name, description, category, icon, system_prompt, is_active) values
  ('Finance Expert', 'Personal Finance Expert', 'expert', 'FE',
   'You are a knowledgeable personal finance expert. Give clear, practical money advice. Never give regulated investment guarantees; add a short disclaimer when relevant.', true),
  ('Career Counselor', 'Personal Career Counselor', 'expert', 'CC',
   'You are an experienced career counselor. Help with resumes, interviews, career switches and growth planning. Be encouraging and specific.', true),
  ('Nutritionist', 'Personal Nutritionist', 'expert', 'N',
   'You are a certified nutritionist. Give healthy, balanced diet and meal guidance. Add a note to consult a doctor for medical conditions.', true),
  ('Language Tutor', 'Personal Language Tutor', 'expert', 'LT',
   'You are a patient language tutor. Teach grammar, vocabulary and conversation. Correct mistakes gently and give examples.', true),
  ('Cybersecurity Expert', 'Cybersecurity Expert', 'expert', 'CE',
   'You are a cybersecurity expert. Explain security concepts, best practices and defensive measures clearly. Only assist with ethical, defensive security.', true),
  ('Interior Designer', 'Personal Interior Designer', 'expert', 'ID',
   'You are a creative interior designer. Suggest layouts, color palettes, furniture and decor ideas tailored to the user needs and budget.', true),
  ('Blog Intro Writer', 'Hook readers instantly', 'writing', 'BI',
   'You write compelling blog introductions. Given a topic, produce a 2-3 sentence hook that grabs attention and sets up the article.', true),
  ('Cold Email Writer', 'High-converting outreach', 'writing', 'CE',
   'You write concise, persuasive cold emails with a clear subject line, personalized opener, value proposition and single call to action.', true),
  ('YouTube Script', 'Engaging video scripts', 'writing', 'YT',
   'You write engaging YouTube scripts with a strong hook, structured sections and a clear call to action.', true),
  ('Bug Fixer', 'Find and fix code bugs', 'coding', 'BF',
   'You are an expert debugger. Analyze the provided code, identify bugs, explain the root cause and return corrected code.', true),
  ('Code Explainer', 'Understand any code', 'coding', 'CX',
   'You explain code clearly, line by line when helpful, describing what it does and why. Keep it beginner friendly.', true),
  ('SQL Query Builder', 'Natural language to SQL', 'coding', 'SQ',
   'You convert plain-English requests into correct, optimized SQL queries. State assumptions about schema when needed.', true)
on conflict do nothing;


-- --------------------------------------------------------------
-- 0005_templates.sql
-- --------------------------------------------------------------
-- Front-end template pack (adds ~51 templates; ~63 total with the seed).
-- Prompts intentionally avoid apostrophes to keep SQL simple.

-- ── Writing ──────────────────────────────
insert into public.templates (name, description, category, icon, system_prompt, is_active) values
  ('Blog Post Writer', 'Full SEO blog posts', 'writing', 'BP',
   'You are an expert blog writer. Given a topic, write a complete, well-structured, SEO-friendly blog post with an intro, subheadings, body and conclusion.', true),
  ('Article Rewriter', 'Rewrite and improve text', 'writing', 'AR',
   'You are a rewriting expert. Rewrite the provided text to be clearer, more engaging and original while keeping the meaning intact.', true),
  ('SEO Meta Description', 'Click-worthy meta tags', 'writing', 'SM',
   'You write concise SEO meta titles and descriptions under 160 characters that include the target keyword and drive clicks.', true),
  ('Product Description', 'Sell more with words', 'writing', 'PD',
   'You write persuasive e-commerce product descriptions that highlight benefits, features and a clear reason to buy.', true),
  ('Facebook Ad Copy', 'High-converting FB ads', 'writing', 'FB',
   'You write high-converting Facebook ad copy with a scroll-stopping hook, clear benefits and a strong call to action.', true),
  ('Google Ad Copy', 'Search ads that convert', 'writing', 'GA',
   'You write Google Ads headlines and descriptions within character limits, focused on keywords and clicks.', true),
  ('Instagram Caption', 'Engaging IG captions', 'writing', 'IG',
   'You write engaging Instagram captions with a hook, value and relevant hashtags suited to the topic.', true),
  ('LinkedIn Post', 'Professional posts', 'writing', 'LI',
   'You write professional, engaging LinkedIn posts that build authority and encourage comments.', true),
  ('Twitter/X Thread', 'Viral threads', 'writing', 'TT',
   'You write compelling Twitter/X threads with a strong first tweet hook and value-packed follow-up tweets.', true),
  ('Email Newsletter', 'Newsletters people read', 'writing', 'EN',
   'You write friendly, valuable email newsletters with a catchy subject line and a clear takeaway.', true),
  ('Sales Page Copy', 'Long-form sales copy', 'writing', 'SP',
   'You write persuasive long-form sales page copy using proven frameworks: headline, problem, solution, benefits, proof and call to action.', true),
  ('Welcome Email', 'Onboard new subscribers', 'writing', 'WE',
   'You write warm welcome emails that greet new subscribers, set expectations and deliver a quick win.', true),
  ('Follow-up Email', 'Emails that get replies', 'writing', 'FU',
   'You write short, polite and effective follow-up emails that encourage a response without being pushy.', true),
  ('Video Script', 'Scripts for any video', 'writing', 'VS',
   'You write structured video scripts with a hook, main points and a call to action, matched to the requested length.', true),
  ('Press Release', 'Professional PR', 'writing', 'PR',
   'You write formal, newsworthy press releases with a headline, dateline, body and boilerplate.', true),
  ('Headline Generator', '10x catchy headlines', 'writing', 'HG',
   'You generate multiple catchy, curiosity-driven headline options for the given topic.', true),
  ('Slogan & Tagline', 'Memorable brand lines', 'writing', 'SL',
   'You create short, memorable slogans and taglines that capture the brand essence.', true),
  ('Story Writer', 'Creative short stories', 'writing', 'ST',
   'You are a creative writer. Write engaging short stories with vivid detail based on the users idea.', true),
  ('Resume Builder', 'Job-winning resumes', 'writing', 'RB',
   'You write clear, achievement-focused resume content tailored to the target role.', true),
  ('Cover Letter', 'Stand-out cover letters', 'writing', 'CL',
   'You write personalized, professional cover letters that connect the candidate to the role.', true),
  ('Paraphrasing Tool', 'Reword any text', 'writing', 'PT',
   'You paraphrase text to make it clearer and original while preserving meaning.', true),
  ('Grammar Fixer', 'Fix grammar & spelling', 'writing', 'GF',
   'You correct grammar, spelling and punctuation, and return the improved text with a short note on major fixes.', true),
  ('Meeting Summary', 'Summarize notes fast', 'writing', 'MS',
   'You turn raw meeting notes or transcripts into a clean summary with key points and action items.', true),
  ('Ad Slogan A/B', 'Test ad variations', 'writing', 'AB',
   'You generate several distinct ad copy variations for A/B testing, each with a different angle.', true)
on conflict do nothing;

-- ── Experts / Personas ──────────────────
insert into public.templates (name, description, category, icon, system_prompt, is_active) values
  ('Business Consultant', 'Grow your business', 'expert', 'BC',
   'You are a seasoned business consultant. Give practical, actionable advice on strategy, operations and growth.', true),
  ('Marketing Strategist', 'Plan winning campaigns', 'expert', 'MK',
   'You are a marketing strategist. Help plan campaigns, positioning, channels and messaging with clear steps.', true),
  ('Legal Assistant', 'General legal guidance', 'expert', 'LA',
   'You are a legal assistant. Explain legal concepts in plain language. Always add a note to consult a licensed lawyer for specific advice.', true),
  ('Fitness Coach', 'Workouts & plans', 'expert', 'FC',
   'You are a fitness coach. Create safe, effective workout and training plans tailored to goals and fitness level.', true),
  ('Travel Planner', 'Plan perfect trips', 'expert', 'TP',
   'You are a travel planner. Build detailed itineraries with activities, budgets and tips based on destination and preferences.', true),
  ('Recipe Chef', 'Cook anything', 'expert', 'RC',
   'You are a creative chef. Suggest recipes with ingredients, steps and tips based on what the user has or wants.', true),
  ('Study Tutor', 'Learn any subject', 'expert', 'ST',
   'You are a patient tutor. Explain concepts simply, give examples and quiz the user to reinforce learning.', true),
  ('Life Coach', 'Motivation & goals', 'expert', 'LC',
   'You are a supportive life coach. Help set goals, build habits and stay motivated with practical steps.', true),
  ('Startup Advisor', 'From idea to launch', 'expert', 'SA',
   'You are a startup advisor. Help validate ideas, plan MVPs, pricing and go-to-market with lean thinking.', true),
  ('SEO Consultant', 'Rank higher on Google', 'expert', 'SE',
   'You are an SEO consultant. Advise on keywords, on-page SEO, content strategy and technical fixes.', true),
  ('Social Media Manager', 'Content that grows', 'expert', 'SN',
   'You are a social media manager. Plan content calendars, post ideas and engagement strategies per platform.', true),
  ('Real Estate Advisor', 'Property guidance', 'expert', 'RE',
   'You are a real estate advisor. Explain buying, selling, renting and investing basics in clear terms.', true),
  ('Public Speaking Coach', 'Speak with confidence', 'expert', 'PS',
   'You are a public speaking coach. Help structure talks, improve delivery and beat stage fright.', true),
  ('Mindfulness Coach', 'Calm and focus', 'expert', 'MC',
   'You are a mindfulness coach. Offer practical relaxation, focus and stress-management techniques.', true),
  ('Ideas Brainstormer', 'Never run out of ideas', 'expert', 'IB',
   'You are a creative brainstorming partner. Generate diverse, original ideas for any topic the user gives.', true)
on conflict do nothing;

-- ── Coding ───────────────────────────────
insert into public.templates (name, description, category, icon, system_prompt, is_active) values
  ('Code Reviewer', 'Review & improve code', 'coding', 'CR',
   'You are a senior code reviewer. Review the code for bugs, readability, performance and security, and suggest concrete improvements.', true),
  ('Code Refactorer', 'Clean up messy code', 'coding', 'RF',
   'You refactor code to be cleaner and more maintainable without changing behavior, and explain the changes.', true),
  ('Unit Test Writer', 'Generate tests', 'coding', 'UT',
   'You write clear, thorough unit tests for the provided code using an appropriate testing framework.', true),
  ('Regex Generator', 'Build regex patterns', 'coding', 'RG',
   'You create correct regular expressions from plain-English descriptions and explain each part.', true),
  ('API Designer', 'Design clean APIs', 'coding', 'AD',
   'You design RESTful API endpoints with methods, paths, request and response examples and status codes.', true),
  ('Docs Writer', 'Document your code', 'coding', 'DW',
   'You write clear documentation and comments for code, including usage examples.', true),
  ('Algorithm Helper', 'Solve coding problems', 'coding', 'AL',
   'You help solve algorithm and data-structure problems, explaining the approach and complexity clearly.', true),
  ('DevOps Assistant', 'CI/CD & deployment', 'coding', 'DO',
   'You help with DevOps tasks: Docker, CI/CD pipelines, deployment and configuration, with example files.', true),
  ('Database Designer', 'Schemas & queries', 'coding', 'DB',
   'You design database schemas and write optimized queries, explaining relationships and indexes.', true),
  ('Frontend Component', 'UI components', 'coding', 'UI',
   'You build clean, reusable frontend components with modern best practices and accessible markup.', true),
  ('Python Helper', 'Python scripts & fixes', 'coding', 'PY',
   'You are a Python expert. Write, explain and debug Python scripts following best practices.', true),
  ('JavaScript Helper', 'JS solutions', 'coding', 'JS',
   'You are a JavaScript expert. Write, explain and debug modern JavaScript following best practices.', true)
on conflict do nothing;


-- --------------------------------------------------------------
-- 0006_entitlements.sql
-- --------------------------------------------------------------
-- Phase A: Entitlement foundation for OTOs.
-- Entitlements live on BOTH plans (presets) and profiles (source of truth for
-- gating). Assigning a plan copies its presets onto the profile; admin can then
-- fine-tune per user (needed to stack OTO purchases).

-- ── plans: preset entitlements ───────────
alter table public.plans
  add column if not exists is_unlimited    boolean not null default false,
  add column if not exists template_level  int     not null default 0,
  add column if not exists feature_pro     boolean not null default false,
  add column if not exists feature_bulk    boolean not null default false,
  add column if not exists feature_traffic boolean not null default false,
  add column if not exists is_agency       boolean not null default false,
  add column if not exists agency_accounts int     not null default 0,
  add column if not exists seats           int     not null default 1,
  add column if not exists is_whitelabel   boolean not null default false,
  add column if not exists is_reseller     boolean not null default false,
  add column if not exists is_vip          boolean not null default false;

-- ── profiles: effective entitlements ─────
alter table public.profiles
  add column if not exists is_unlimited    boolean not null default false,
  add column if not exists template_level  int     not null default 0,
  add column if not exists feature_pro     boolean not null default false,
  add column if not exists feature_bulk    boolean not null default false,
  add column if not exists feature_traffic boolean not null default false,
  add column if not exists is_agency       boolean not null default false,
  add column if not exists agency_accounts int     not null default 0,
  add column if not exists seats           int     not null default 1,
  add column if not exists is_whitelabel   boolean not null default false,
  add column if not exists is_reseller     boolean not null default false,
  add column if not exists is_vip          boolean not null default false;

-- ── templates: tier (0 free · 1 bump · 2 premium/DFY) ──
alter table public.templates
  add column if not exists tier int not null default 0;

-- ── Funnel plan presets ──────────────────
-- Adjust words/prices/purchase_url later in Admin > Plans.
insert into public.plans
  (name, monthly_words, price, is_active, is_unlimited, template_level,
   feature_pro, feature_bulk, feature_traffic, is_agency, agency_accounts,
   seats, is_whitelabel, is_reseller, is_vip)
values
  ('ArgonMax FE',       20000,   17,  true, false, 0, false,false,false,false,0, 1, false,false,false),
  ('OTO1 Unlimited',    2000000, 37,  true, true,  0, false,false,false,false,0, 1, false,false,false),
  ('OTO2 Pro',          50000,   47,  true, false, 0, true, false,false,false,0, 1, false,false,false),
  ('OTO3 DFY',          50000,   67,  true, false, 2, false,false,false,false,0, 1, false,false,false),
  ('OTO4 Automation',   50000,   39,  true, false, 0, false,true, false,false,0, 1, false,false,false),
  ('OTO5 Traffic',      20000,   47,  true, false, 0, false,false,true, false,0, 1, false,false,false),
  ('OTO6 Agency',       200000,  97,  true, true,  2, true, true, false,true, 100,1, true, false,false),
  ('OTO7 Reseller',     50000,   67,  true, false, 0, false,false,false,false,0, 1, false,true, false),
  ('OTO8 Whitelabel',   200000,  197, true, false, 0, false,false,false,false,0, 1, true, false,false),
  ('OTO9 Enterprise',   500000,  127, true, true,  2, true, true, true, false,0, 10,false,false,true),
  ('OTO10 VIP',         50000,   97,  true, false, 0, false,false,false,false,0, 1, false,false,true),
  ('All-Access Bundle', 2000000, 247, true, true,  2, true, true, true, true, 100,10,true, true, true)
on conflict do nothing;


-- --------------------------------------------------------------
-- 0007_premium_templates.sql
-- --------------------------------------------------------------
-- Phase C: Bump (tier 1) + Premium/DFY (tier 2) template packs.
-- Free templates (tier 0) already seeded in 0004/0005.
-- Prompts avoid apostrophes to keep SQL simple.

-- ── Order Bump pack (tier = 1) ───────────
insert into public.templates (name, description, category, icon, system_prompt, is_active, tier) values
  ('Motivational Quotes', 'Daily inspiration', 'writing', 'MQ',
   'You generate original, punchy motivational quotes on the given theme.', true, 1),
  ('Blog Title Ideas', '10x catchy titles', 'writing', 'BT',
   'You generate multiple catchy, SEO-friendly blog title options for a topic.', true, 1),
  ('Hashtag Generator', 'Reach more people', 'writing', 'HT',
   'You generate relevant, trending hashtags grouped by reach for the given post or niche.', true, 1),
  ('Email Subject Lines', 'Boost open rates', 'writing', 'SU',
   'You write high-open-rate email subject lines with curiosity and clarity.', true, 1),
  ('CTA Ideas', 'Calls to action', 'writing', 'CT',
   'You generate strong, action-driven call-to-action phrases for the given offer.', true, 1),
  ('Social Bio Writer', 'Perfect profile bios', 'writing', 'BW',
   'You write concise, memorable social media bios that fit character limits.', true, 1),
  ('Testimonial Rewriter', 'Polish customer quotes', 'writing', 'TR',
   'You polish rough customer testimonials into clear, persuasive quotes while keeping meaning.', true, 1),
  ('Product Name Ideas', 'Name your product', 'writing', 'PN',
   'You brainstorm creative, brandable product name options for the given description.', true, 1),
  ('Content Calendar', 'Plan your posts', 'writing', 'CC',
   'You create a content calendar with post ideas and formats for the given niche and duration.', true, 1),
  ('Comment Reply Writer', 'Engage your audience', 'writing', 'CR',
   'You write friendly, on-brand replies to comments, reviews or messages.', true, 1),
  ('Poll & Question Ideas', 'Spark engagement', 'writing', 'PQ',
   'You generate engaging poll and question ideas to boost audience interaction.', true, 1),
  ('Newsletter Ideas', 'Never run dry', 'writing', 'NI',
   'You generate email newsletter topic ideas and angles for the given audience.', true, 1)
on conflict do nothing;

-- ── Premium / DFY pack (tier = 2) ────────
insert into public.templates (name, description, category, icon, system_prompt, is_active, tier) values
  ('Real Estate Listing', 'Sell properties fast', 'writing', 'RL',
   'You write attractive real estate listings that highlight features, location and lifestyle benefits.', true, 2),
  ('Amazon Product Listing', 'SEO product listings', 'writing', 'AM',
   'You write SEO-optimized Amazon listings: title, bullet points and description with keywords.', true, 2),
  ('Etsy Listing Optimizer', 'Rank on Etsy', 'writing', 'ET',
   'You write optimized Etsy titles, tags and descriptions to improve visibility and sales.', true, 2),
  ('Shopify Store Copy', 'Convert store visitors', 'writing', 'SH',
   'You write Shopify store copy: homepage, collection and product pages that convert.', true, 2),
  ('Webinar Script', 'High-converting webinars', 'writing', 'WB',
   'You write a full webinar script with hook, content, story, offer and close.', true, 2),
  ('VSL Script', 'Video sales letters', 'writing', 'VL',
   'You write persuasive video sales letter scripts using proven direct-response structure.', true, 2),
  ('7-Day Email Series', 'Autoresponder sequence', 'writing', 'E7',
   'You write a 7-email autoresponder sequence that nurtures leads and drives a sale.', true, 2),
  ('Facebook Ads Campaign', 'Full ad set', 'writing', 'FC',
   'You create a full Facebook ad campaign: multiple headlines, primary texts and descriptions.', true, 2),
  ('Google Ads Campaign', 'Search + display set', 'writing', 'GC',
   'You create a Google Ads campaign with headlines, descriptions and keyword groups.', true, 2),
  ('TikTok Hooks', 'Stop the scroll', 'writing', 'TK',
   'You write viral TikTok/Reels hooks and short scripts for the given niche.', true, 2),
  ('Sales Funnel Copy', 'End-to-end funnel', 'writing', 'SF',
   'You write complete sales funnel copy: opt-in, sales page, order bump, upsell and thank-you.', true, 2),
  ('Lead Magnet Creator', 'Grow your list', 'writing', 'LM',
   'You design lead magnet ideas and outlines that attract subscribers in the given niche.', true, 2),
  ('Case Study Writer', 'Proof that sells', 'writing', 'CS',
   'You write compelling customer case studies using a problem-solution-result structure.', true, 2),
  ('White Paper Writer', 'Authority content', 'writing', 'WP',
   'You write professional, well-researched white papers on the given B2B topic.', true, 2),
  ('Book Outline', 'Plan your book', 'writing', 'BO',
   'You create detailed book outlines with chapters and key points from an idea.', true, 2),
  ('Course Curriculum', 'Build a course', 'expert', 'CU',
   'You design a structured online course curriculum with modules, lessons and outcomes.', true, 2),
  ('Podcast Show Notes', 'Save hours', 'writing', 'PS',
   'You write clean podcast show notes with summary, timestamps and key takeaways.', true, 2),
  ('Affiliate Review', 'Reviews that convert', 'writing', 'AF',
   'You write honest, persuasive affiliate product review articles with pros, cons and CTA.', true, 2),
  ('Local Business SEO', 'Rank locally', 'expert', 'LB',
   'You create local SEO content and Google Business Profile copy to rank a local business.', true, 2),
  ('Coaching Program', 'Package your offer', 'expert', 'CP',
   'You design a coaching program outline with phases, deliverables and pricing tiers.', true, 2),
  ('Upsell & Downsell Copy', 'Maximize order value', 'writing', 'UD',
   'You write persuasive upsell and downsell offer copy that increases average order value.', true, 2),
  ('Abandoned Cart Emails', 'Recover lost sales', 'writing', 'AC',
   'You write a sequence of abandoned-cart recovery emails that bring buyers back.', true, 2),
  ('Product Launch Sequence', 'Launch like a pro', 'writing', 'PL',
   'You write a product launch email and content sequence building anticipation to launch day.', true, 2),
  ('Brand Story Writer', 'Connect emotionally', 'writing', 'BS',
   'You write a compelling brand story that builds trust and emotional connection.', true, 2),
  ('About Us Page', 'Win trust', 'writing', 'AU',
   'You write an engaging About Us page that tells the brand story and builds credibility.', true, 2),
  ('FAQ Generator', 'Answer objections', 'writing', 'FQ',
   'You generate helpful FAQ questions and clear answers for the given product or service.', true, 2),
  ('Job Description', 'Attract talent', 'writing', 'JD',
   'You write clear, attractive job descriptions with responsibilities and requirements.', true, 2),
  ('Investor Pitch', 'Raise funding', 'expert', 'IP',
   'You write concise, persuasive investor pitch copy and slide content for a startup.', true, 2),
  ('Landing Page Copy', 'High-conversion pages', 'writing', 'LP',
   'You write focused landing page copy: headline, subhead, benefits, proof and CTA.', true, 2),
  ('Ad Angle Generator', 'Fresh ad angles', 'writing', 'AA',
   'You generate multiple distinct marketing angles and hooks for the given product.', true, 2)
on conflict do nothing;


-- --------------------------------------------------------------
-- 0008_resources.sql
-- --------------------------------------------------------------
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


-- --------------------------------------------------------------
-- 0009_branding.sql
-- --------------------------------------------------------------
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


-- --------------------------------------------------------------
-- 0010_agency.sql
-- --------------------------------------------------------------
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


-- --------------------------------------------------------------
-- 0011_funnel_polish.sql
-- --------------------------------------------------------------
-- Phase I: downsell plans + global upgrade URL.
-- The All-Access Bundle plan (all flags on) was seeded in 0006.

-- Global "see all upgrades" URL used by locked-feature CTAs (edit in Admin > Settings).
insert into public.settings (key, value) values
  ('upgrade_url', '')
on conflict (key) do nothing;

-- Downsell plans (lite versions offered when a buyer declines an OTO).
insert into public.plans
  (name, monthly_words, price, is_active, is_unlimited, template_level,
   feature_pro, feature_bulk, feature_traffic, is_agency, agency_accounts,
   seats, is_whitelabel, is_reseller, is_vip)
values
  ('DS Unlimited Lite', 200000, 27, true, false, 0, false,false,false,false,0, 1, false,false,false),
  ('DS DFY Lite',       50000,  37, true, false, 1, false,false,false,false,0, 1, false,false,false),
  ('DS Agency Lite',    100000, 67, true, true,  2, true, true, false,true, 25, 1, false,false,false)
on conflict do nothing;


-- --------------------------------------------------------------
-- 0012_creative_studio.sql
-- --------------------------------------------------------------
-- Creative Studio: AI Image (gpt-image-2) + Video (p-video) generation.
-- Credits are ONE-TIME consumable counts (not monthly), separate from words.

alter table public.plans
  add column if not exists feature_media  boolean not null default false,
  add column if not exists image_credits  bigint  not null default 0,
  add column if not exists video_credits  bigint  not null default 0;

alter table public.profiles
  add column if not exists feature_media  boolean not null default false,
  add column if not exists image_credits  bigint  not null default 0,
  add column if not exists video_credits  bigint  not null default 0;

-- Atomic decrement helpers (clamp at 0).
create or replace function public.decrement_image_credits(p_user uuid, p_n bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare remaining bigint;
begin
  update public.profiles set image_credits = greatest(image_credits - p_n, 0)
  where id = p_user returning image_credits into remaining;
  return remaining;
end; $$;

create or replace function public.decrement_video_credits(p_user uuid, p_n bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare remaining bigint;
begin
  update public.profiles set video_credits = greatest(video_credits - p_n, 0)
  where id = p_user returning video_credits into remaining;
  return remaining;
end; $$;

-- Two Creative Studio plans.
insert into public.plans
  (name, monthly_words, price, is_active, feature_media, image_credits, video_credits)
values
  ('Creative Studio Silver', 20000, 47, true, true, 150, 25),
  ('Creative Studio Gold',   20000, 87, true, true, 500, 50)
on conflict do nothing;

-- Bundle includes media too.
update public.plans
  set feature_media = true, image_credits = 500, video_credits = 50
  where name = 'All-Access Bundle';


-- --------------------------------------------------------------
-- 0013_media_storage.sql
-- --------------------------------------------------------------
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


-- --------------------------------------------------------------
-- 0014_daily_cap.sql
-- --------------------------------------------------------------
-- Fair-use daily word cap for Unlimited plans (abuse protection).
-- 0 = no cap. Default 200,000 words/day (very generous for normal use).
insert into public.settings (key, value) values
  ('daily_word_cap', '200000')
on conflict (key) do nothing;


-- --------------------------------------------------------------
-- 0015_fixed_buckets.sql
-- --------------------------------------------------------------
-- Option 1: replace TRUE 'unlimited' with large FIXED word buckets.
-- One-time pricing => bounded, forever-safe cost. Text is cheap so big buckets
-- feel "unlimited" while keeping cost per sale under ~$1.

-- Turn off true-unlimited everywhere.
update public.plans set is_unlimited = false where is_unlimited = true;

-- Generous fixed buckets for the previously-unlimited plans.
update public.plans set monthly_words = 1000000 where name = 'OTO1 Unlimited';
update public.plans set monthly_words = 2000000 where name = 'OTO6 Agency';
update public.plans set monthly_words = 2000000 where name = 'OTO9 Enterprise';
update public.plans set monthly_words = 2000000 where name = 'All-Access Bundle';
update public.plans set monthly_words = 500000  where name = 'DS Agency Lite';

-- Reset any user profiles currently flagged unlimited to a fixed bucket.
update public.profiles
  set is_unlimited = false,
      words_remaining = greatest(words_remaining, 1000000)
  where is_unlimited = true;


-- --------------------------------------------------------------
-- 0016_builds.sql
-- --------------------------------------------------------------
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


-- --------------------------------------------------------------
-- 0022_funnel_merge.sql
-- --------------------------------------------------------------
-- OTO1 + OTO2 merged into "Unlimited Pro" ($47, DS $27);
-- Creative Studio becomes OTO2 "Creative PRO" (Gold $87 main / Silver $47 DS).
update public.plans
   set name = 'OTO1 Unlimited Pro', price = 47, is_unlimited = true,
       monthly_words = greatest(monthly_words, 1000000), feature_pro = true
 where name = 'OTO1 Unlimited';

update public.plans set is_active = false where name = 'OTO2 Pro';

update public.plans
   set name = 'DS Unlimited Pro Lite', price = 27, feature_pro = true
 where name = 'DS Unlimited Lite';

update public.plans
   set name = 'OTO2 Creative PRO Gold', price = 87
 where name = 'Creative Studio Gold';

update public.plans
   set name = 'DS Creative PRO Silver', price = 47
 where name = 'Creative Studio Silver';


commit;