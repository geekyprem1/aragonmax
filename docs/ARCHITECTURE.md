# Architecture — ArgonMax AI (MVP)

**Companion to:** `docs/PRD.md`
**Version:** 0.1
**Stack:** Next.js (App Router) · Supabase (Postgres + Auth + RLS) · Moonshot (Kimi) API · Tailwind CSS · Vercel

---

## 1. System Overview

```
                 ┌───────────────────────────────────────┐
                 │              Browser (User)             │
                 │  Next.js Client Components (dashboard)  │
                 └───────────────┬───────────────────────┘
                                 │  fetch (same-origin)
                                 ▼
        ┌────────────────────────────────────────────────────┐
        │            Next.js Server (App Router)               │
        │  - Route Handlers (/api/*)  ← AI + credit logic      │
        │  - Server Components         ← data reads            │
        │  - Middleware                ← auth + role guard     │
        └───────┬───────────────────────────────┬────────────┘
                │ service-role (server only)     │ Moonshot API
                ▼                                 ▼
        ┌───────────────┐                 ┌──────────────────┐
        │   Supabase     │                 │  Kimi (Moonshot) │
        │  Auth + Postgres│                │   Chat API       │
        │  + RLS         │                 └──────────────────┘
        └───────────────┘
```

**Key principle:** Saara AI call aur credit deduction **server-side** hota hai. Client kabhi Moonshot API key ya service-role key nahi dekhta. Client sirf apne data ko RLS ke through padhta hai; likhna (credits, usage) server route handlers karte hain.

---

## 2. Folder Structure

```
ArgonMax AI/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── TASKS.md
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # root layout
│   │   ├── globals.css
│   │   ├── page.tsx                  # redirect → /login or /dashboard
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── (user)/                   # user-protected group
│   │   │   ├── layout.tsx            # sidebar + auth guard (user)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── chat/page.tsx
│   │   │   ├── writer/page.tsx
│   │   │   ├── code/page.tsx
│   │   │   └── templates/page.tsx
│   │   ├── (admin)/                  # admin-protected group
│   │   │   ├── layout.tsx            # admin guard
│   │   │   └── admin/
│   │   │       ├── page.tsx          # overview
│   │   │       ├── users/page.tsx
│   │   │       ├── plans/page.tsx
│   │   │       ├── templates/page.tsx
│   │   │       └── settings/page.tsx
│   │   └── api/
│   │       ├── chat/route.ts
│   │       ├── writer/route.ts
│   │       ├── code/route.ts
│   │       └── admin/
│   │           ├── users/route.ts
│   │           ├── plans/route.ts
│   │           ├── templates/route.ts
│   │           └── settings/route.ts
│   ├── components/
│   │   ├── ui/                       # buttons, inputs, cards
│   │   ├── layout/                   # Sidebar, Topbar, CreditBar
│   │   ├── chat/                     # ChatWindow, ModelSelector, MessageList
│   │   └── admin/                    # UserTable, PlanForm, TemplateForm
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # browser client (anon key)
│   │   │   ├── server.ts             # server client (cookies, anon)
│   │   │   └── admin.ts              # service-role client (server only)
│   │   ├── kimi/
│   │   │   ├── client.ts             # Moonshot API wrapper
│   │   │   └── models.ts             # model helpers
│   │   ├── credits.ts                # word count + deduction logic
│   │   ├── auth.ts                   # getSession, requireUser, requireAdmin
│   │   └── words.ts                  # countWords()
│   ├── middleware.ts                 # route protection
│   └── types/
│       └── db.ts                     # DB types
├── supabase/
│   └── migrations/                   # SQL migrations
├── .env.local.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## 3. Authentication & Authorization

### 3.1 Login flow
1. Admin ne Supabase Auth mein user create kiya (email + password) via admin panel.
2. User `/login` pe email/password daalta hai → Supabase `signInWithPassword`.
3. Session cookie set hoti hai (Supabase SSR helpers via `@supabase/ssr`).
4. Redirect → `/dashboard`.

### 3.2 Route protection (`middleware.ts`)
- `middleware.ts` har request pe session refresh karta hai (Supabase SSR pattern).
- Protected paths (`/dashboard`, `/chat`, `/writer`, `/code`, `/templates`, `/admin/*`) — no session → redirect `/login`.
- Admin paths (`/admin/*`) — extra check: `profiles.role === 'admin'`, warna redirect `/dashboard`.

> Middleware sirf session presence check karega (fast). Fine-grained `role` check server layout/route handler mein hoga (`requireAdmin()`), kyunki role DB mein hai.

### 3.3 Helpers (`lib/auth.ts`)
- `getSession()` — current Supabase session.
- `getProfile()` — profile row (role, plan, words_remaining).
- `requireUser()` — throw/redirect if no session; returns profile.
- `requireAdmin()` — requires role === 'admin'.

---

## 4. Supabase Clients (3 types)

| Client | Key | Where | Purpose |
|--------|-----|-------|---------|
| `client.ts` | anon | Browser | User reads via RLS (own data) |
| `server.ts` | anon + cookies | Server components / route handlers | Auth-aware reads |
| `admin.ts` | **service_role** | Server route handlers ONLY | Credit deduction, admin writes, user creation |

**Rule:** `service_role` key `.env` mein `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_`). Kabhi client bundle mein import na ho.

---

## 5. RLS Policies (high-level)

| Table | User (self) | Admin | Notes |
|-------|-------------|-------|-------|
| `profiles` | read own | full | words_remaining write → server only (service role) |
| `plans` | read active | full | |
| `templates` | read active | full | |
| `conversations` | CRUD own | read all | |
| `messages` | CRUD own (via conversation) | read all | word_used set server-side |
| `usage_logs` | read own | read all | insert → server only |
| `settings` | none | full | API key never exposed to client |
| `models` | read active | full | |

- RLS ON on all tables.
- Credit-critical writes (`words_remaining` decrement, `usage_logs` insert) **service-role** se hote hain, RLS bypass — isliye validation server code mein.

---

## 6. AI Request Flow (Chat / Writer / Code)

Sabse important flow — credit deduction yaha secure hona chahiye.

```
Client → POST /api/chat { conversationId?, model, prompt, systemPrompt? }
   │
   ▼ (server route handler)
1. requireUser()  → profile
2. if profile.status !== 'active' → 403
3. if profile.words_remaining <= 0 → 402 (block, upgrade CTA)
4. Validate model against `models` table (is_active)
5. Load Moonshot API key from `settings` (server cache)
6. Call Kimi API (stream response)
7. Accumulate assistant output text
8. words_used = countWords(outputText)
9. Atomic deduct: RPC decrement_words(user_id, words_used)  ← DB function
10. Insert usage_logs + messages (words_used)
11. Return stream / final text + words_remaining
```

### 6.1 Word counting (`lib/words.ts`)
- `countWords(text)` = split on whitespace, filter empty. Simple aur predictable (user "words" samajhta hai).
- Sirf **assistant output** count hota hai deduction ke liye (input free). (Decision — simple rakha; chaaho to input+output baad mein.)

### 6.2 Atomic deduction (Postgres function)
Race condition (do parallel requests) se bachne ke liye DB-side atomic decrement:

```sql
create or replace function decrement_words(p_user uuid, p_words bigint)
returns bigint
language plpgsql
security definer
as $$
declare remaining bigint;
begin
  update profiles
     set words_remaining = greatest(words_remaining - p_words, 0)
   where id = p_user
   returning words_remaining into remaining;
  return remaining;
end; $$;
```

### 6.3 Pre-check vs post-charge
- Pre-check `words_remaining > 0` request se pehle (hard block on empty).
- Post-charge actual output words. Agar user last request mein thoda overshoot kare (e.g. 50 words remaining, 200 generate) — allow that one, `greatest(...,0)` se 0 pe clamp. MVP ke liye acceptable (simple + user-friendly).

### 6.4 Streaming
- Moonshot streaming response → Next.js `ReadableStream` se client ko relay.
- Stream complete hone par server deduction karta hai (accumulated text se).

---

## 7. Kimi (Moonshot) Integration (`lib/kimi/`)

- Base URL: Moonshot OpenAI-compatible endpoint (`/v1/chat/completions`).
- Auth: `Authorization: Bearer <MOONSHOT_API_KEY>` (from settings/env, server only).
- `client.ts`: `chatCompletion({ model, messages, stream })`.
- Model list DB-driven (`models` table). Default model = `is_default` row (ArgonMax K3), badge "Recommended".
- Errors (rate limit, invalid key) → mapped to friendly messages; no deduction on failure.

---

## 8. Admin Operations

| Action | Route | Server logic |
|--------|-------|--------------|
| Create user | `POST /api/admin/users` | `admin.auth.admin.createUser({email,password})` + insert profile (role, plan, words) |
| Edit/upgrade user | `PATCH /api/admin/users` | update plan_id, set/add words_remaining |
| Disable user | `PATCH` | status='disabled' |
| Delete user | `DELETE` | delete auth user + profile |
| Plan CRUD | `/api/admin/plans` | plans table |
| Template CRUD | `/api/admin/templates` | templates table |
| Settings | `/api/admin/settings` | API key, default model, models list |

All admin routes gated by `requireAdmin()`.

---

## 9. Environment Variables

```
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only
MOONSHOT_API_KEY=                 # fallback; primary stored in settings table
MOONSHOT_BASE_URL=https://api.moonshot.ai/v1
```

- API key DB `settings` table mein bhi rakh sakte hain (admin editable). Env fallback for first boot.
- `.env.local.example` committed, real `.env.local` gitignored.

---

## 10. Security Checklist

- [ ] Service-role + Moonshot key server-only (no `NEXT_PUBLIC_`).
- [ ] RLS ON for every table.
- [ ] Admin routes `requireAdmin()` check.
- [ ] Credit deduction via atomic DB function (no client trust).
- [ ] Input validation (zod) on all API routes.
- [ ] User status check (`active`) before AI calls.
- [ ] No AI/admin logic in client components.

---

## 11. Deployment

- **Frontend/API:** Vercel (Next.js).
- **DB/Auth:** Supabase cloud project.
- Migrations: `supabase/migrations/*.sql` applied via Supabase SQL editor or CLI.
- Env vars set in Vercel project settings.

---

## 12. Open Decisions (defaulted for MVP)

| Decision | MVP default |
|----------|-------------|
| Credit unit | Words (output only) |
| Overshoot on last request | Allowed, clamp to 0 |
| Streaming | Yes (better UX) |
| Model list source | DB `models` table |
| API key storage | `settings` table (env fallback) |
| Password reset | Supabase built-in email |
