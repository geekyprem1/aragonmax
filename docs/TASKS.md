# Tasks — ArgonMax AI (MVP)

**References:** `docs/PRD.md`, `docs/ARCHITECTURE.md`
Sequence order matters — upar se neeche implement karo. Har task ke baad build/typecheck.

---

## Phase 0 — Project Setup

- [ ] 0.1 Next.js (App Router, TypeScript) project init + Tailwind CSS setup
- [ ] 0.2 Install deps: `@supabase/supabase-js`, `@supabase/ssr`, `zod`
- [ ] 0.3 Base config: `tsconfig`, `tailwind.config`, `next.config`, folder structure
- [ ] 0.4 `.env.local.example` + `.gitignore`
- [ ] 0.5 Root layout + global styles + placeholder home redirect

## Phase 1 — Supabase & Database

- [ ] 1.1 Migration: `profiles`, `plans`, `templates`, `models`, `settings` tables
- [ ] 1.2 Migration: `conversations`, `messages`, `usage_logs` tables
- [ ] 1.3 Migration: `decrement_words()` Postgres function
- [ ] 1.4 RLS policies for all tables (per architecture §5)
- [ ] 1.5 Seed data: default plans, Kimi models (K3 default), starter templates
- [ ] 1.6 Supabase clients: `client.ts`, `server.ts`, `admin.ts`
- [ ] 1.7 DB types (`types/db.ts`)

## Phase 2 — Auth

- [ ] 2.1 `middleware.ts` — session refresh + protected route redirects
- [ ] 2.2 `lib/auth.ts` — getSession, getProfile, requireUser, requireAdmin
- [ ] 2.3 `/login` page (email/password → Supabase signIn)
- [ ] 2.4 Logout action
- [ ] 2.5 Manual test: seeded admin user login → dashboard

## Phase 3 — Core Libs

- [ ] 3.1 `lib/words.ts` — countWords()
- [ ] 3.2 `lib/kimi/client.ts` — Moonshot chat wrapper (streaming)
- [ ] 3.3 `lib/kimi/models.ts` — load models from DB
- [ ] 3.4 `lib/credits.ts` — pre-check + deduct (calls decrement_words RPC)

## Phase 4 — User Shell & Dashboard

- [ ] 4.1 `(user)/layout.tsx` — sidebar (screenshot style) + auth guard
- [ ] 4.2 Components: Sidebar, Topbar, CreditBar (words used/total)
- [ ] 4.3 `/dashboard` — plan name, words remaining bar, quick links, upgrade CTA (JVZoo/W+ link)

## Phase 5 — AI Chat

- [ ] 5.1 `POST /api/chat` route (auth, status, credit pre-check, Kimi stream, deduct, log)
- [ ] 5.2 ModelSelector (K3 default + "Recommended" badge)
- [ ] 5.3 ChatWindow + MessageList + streaming render
- [ ] 5.4 Conversation list (create/select), save messages
- [ ] 5.5 Empty-credit block + upgrade prompt

## Phase 6 — AI Writer & Code Generator

- [ ] 6.1 `POST /api/writer` route + Writer page (topic, tone, length, output)
- [ ] 6.2 `POST /api/code` route + Code page (prompt, language, syntax-highlighted output)
- [ ] 6.3 Copy/download output buttons

## Phase 7 — Templates

- [ ] 7.1 `/templates` grid (cards, categories, search, favorite)
- [ ] 7.2 Template click → open Chat/Writer pre-loaded with system_prompt
- [ ] 7.3 Wire favorites (per-user)

## Phase 8 — Admin Panel

- [ ] 8.1 `(admin)/layout.tsx` — requireAdmin guard
- [ ] 8.2 Users: list/search + create user (email/password/plan/words) via `/api/admin/users`
- [ ] 8.3 Users: edit/upgrade (plan + words top-up), disable, delete
- [ ] 8.4 Plans CRUD (name, monthly_words, price, purchase_url)
- [ ] 8.5 Templates CRUD (+ enable/disable)
- [ ] 8.6 Settings: Moonshot API key, default model, models list manage
- [ ] 8.7 Admin overview (total users, words used)

## Phase 9 — Polish & Verify

- [ ] 9.1 Error states, loading states, toasts
- [ ] 9.2 Security checklist pass (architecture §10)
- [ ] 9.3 End-to-end manual test: admin creates user → user logs in → uses all modules → credits deduct → empty → upgrade CTA
- [ ] 9.4 Build passes, no type errors
- [ ] 9.5 Deployment notes (Vercel + Supabase env)

---

## Phase 2 features (NOT in MVP — future)
Self-signup, JVZoo/W+ webhook auto-provision, Chat-with-Documents, ArgonMax Vision image understanding, Brand Voice, themes/white-label, multi-admin, affiliate.
