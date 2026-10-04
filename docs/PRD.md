# PRD — ArgonMax AI (MVP)

**Product codename:** ArgonMax AI (placeholder — final naam baad mein)
**Version:** 0.1 (MVP)
**Date:** 2026-07-31
**Owner:** (You / Admin)

---

## 1. Overview

Ek AI SaaS platform jo **ArgonMax K3** ko flagship model ke roop mein highlight karta hai aur Moonshot (Kimi) ke saare available models ko ek clean dashboard mein deta hai. Product WarriorPlus aur JVZoo pe becha jayega. Payment JVZoo/W+ ke direct link se hoga, aur **account provisioning + upgrade 100% manual** hai — admin khud dashboard se user create karega, plan assign karega aur token credits allocate karega.

### Core value proposition
- Ek hi jagah Kimi ke best models — chat, writing, aur coding.
- Ready-to-use expert personas aur templates (fast results, no prompt skill needed).
- Token-based fair usage limits per plan.

> **Note on scope:** Kimi image/video **generate** nahi karta. MVP text + code + templates pe focused hai. Image *understanding* (ArgonMax Vision) aur document-chat Phase 2 mein.

---

## 2. Goals & Non-Goals

### Goals (MVP)
- Admin manually users create/manage kar sake (email/password via Supabase).
- User login karke AI Chat, AI Writer, AI Code Generator, aur Templates use kar sake.
- ArgonMax K3 default aur prominently highlighted ho; dusre Kimi models select kiye ja sakein.
- Har user ke paas token/word credit limit ho jo usage pe deduct ho.
- Admin manually plan upgrade/downgrade aur credit top-up kar sake.
- JVZoo/W+ ka buy/upgrade link dashboard mein dikhe.

### Non-Goals (MVP)
- Koi self-signup nahi (sirf admin banata hai users).
- Koi automatic payment webhook/IPN provisioning nahi.
- Koi image/video generation nahi.
- Koi team/multi-seat accounts nahi.
- Koi affiliate/reseller system nahi.

---

## 3. User Roles

| Role  | Description | Access |
|-------|-------------|--------|
| **Admin** | Aap (owner). Users, plans, credits, templates, API keys manage karta hai. | Admin panel + all user features |
| **User** | Buyer jise admin ne account banake diya. | AI tools apne credit limit tak |

MVP mein single admin. (Multi-admin Phase 2.)

---

## 4. Feature Requirements (MVP)

### 4.1 Authentication
- Supabase email/password login.
- Password reset (Supabase built-in email flow).
- No public signup page — login only. Admin creates accounts.
- Role check (admin vs user) via a `role` field in profile table.

### 4.2 AI Chat
- Chat interface (message history per conversation).
- **Model selector**: ArgonMax K3 (default, highlighted badge "Recommended"), plus other Kimi models (e.g. K2, long-context variant).
- Conversations save hoti rahein (list left/side).
- Har response ke baad tokens/words deduct.
- Stop generation button, copy response, regenerate.

### 4.3 AI Writer
- Free-form prompt + optional template selection.
- Fields: topic, tone, length.
- Output editable text area + copy/download.
- Token deduction on generate.

### 4.4 AI Code Generator
- Prompt describing needed code + "Coding Language" field (screenshot jaisa).
- Syntax-highlighted output + copy button.
- Token deduction on generate.

### 4.5 Templates / Expert Personas
- Grid of cards (screenshot jaisa): icon, name, short description.
- Categories: Experts (Finance, Career, Language Tutor, Cybersecurity, Nutritionist, Interior Designer, Legal, Marketing), Writing (Blog Intro, YouTube Script, Cold Email, Ad Copy, SEO Meta), Coding (Bug Fixer, Code Explainer, SQL Builder, Regex).
- Template = predefined system prompt. Click → opens chat/writer pre-loaded with that persona.
- Search + favorite (star) toggle.
- Admin can add/edit/enable-disable templates.

### 4.6 Word Credit System
- Credit unit = **words** (user-friendly, screenshot jaisa "Words").
- Har user ka `words_remaining`.
- Har AI action ke baad output ke words count karke deduct (server-side count). Kimi API tokens ko internally track kar sakte hain, par user ko hamesha **words** dikhega.
- Credit khatam → block action + show upgrade CTA (JVZoo/W+ link).
- Dashboard pe usage bar dikhaye (words used vs total).

### 4.7 User Dashboard
- Welcome + plan name + credits remaining bar.
- Quick links to modules (Chat, Writer, Code, Templates).
- Upgrade button → JVZoo/W+ external link.

### 4.8 Admin Panel
- **Users**: list, search, create user (email + password + plan + credits), edit, disable, delete.
- **Manual upgrade**: change plan, set/add credits.
- **Plans**: create/edit plans (name, monthly credit amount, price, JVZoo/W+ link).
- **Templates**: CRUD + enable/disable.
- **Settings**: Kimi/Moonshot API key, default model, available models list.
- **Announcements** (optional MVP): simple banner text shown to users.
- Basic usage overview (total users, credits used).

---

## 5. Kimi Model Lineup (config-driven)

Admin panel se models add/enable honge (hardcode nahi). Suggested defaults:
- **ArgonMax K3** — default, highlighted "Recommended" (chat, writing, coding).
- **Kimi K2** — alternative.
- **Long-context variant** — large document/context tasks.

Model list ek DB table/config se aaye taaki naye Kimi models aane par bina code change ke add ho sakein.

---

## 6. Data Model (Supabase / Postgres)

```
profiles
  id (uuid, FK auth.users)
  email
  role            -- 'admin' | 'user'
  plan_id (FK)
  words_remaining (bigint)
  status          -- 'active' | 'disabled'
  created_at

plans
  id
  name
  monthly_words (bigint)
  price
  purchase_url    -- JVZoo/W+ link
  is_active

templates
  id
  name
  description
  category        -- 'expert' | 'writing' | 'coding'
  icon
  system_prompt
  is_active
  created_at

conversations
  id
  user_id (FK)
  title
  model
  created_at

messages
  id
  conversation_id (FK)
  role            -- 'user' | 'assistant'
  content
  words_used
  created_at

usage_logs
  id
  user_id (FK)
  module          -- 'chat' | 'writer' | 'code'
  words_used
  model
  created_at

settings
  key             -- e.g. 'moonshot_api_key', 'default_model'
  value

models
  id
  model_key       -- API identifier
  display_name
  is_default
  is_active
  badge           -- e.g. 'Recommended'
```

Credit deduction aur admin-only writes ke liye **RLS policies** + server-side (Next.js route handlers) validation. Kimi API key **kabhi client pe expose nahi** hogi — sirf server routes se call.

---

## 7. Payment & Upgrade Flow

1. User dashboard pe "Upgrade" dabata hai → JVZoo/W+ external product page khulta hai.
2. User waha payment karta hai.
3. **Admin ko notification** (email from JVZoo/W+, manual check).
4. Admin dashboard se user ka plan change + credits set karta hai.
5. User ko turant naya limit reflect ho jata hai.

MVP mein koi webhook nahi — pure manual. (Auto-provisioning webhook Phase 2 option.)

---

## 8. Tech Stack

- **Frontend/Backend:** Next.js (App Router), API route handlers.
- **Auth + DB:** Supabase (Postgres + Auth + RLS).
- **AI:** Moonshot (Kimi) API — server-side calls only.
- **Styling:** Tailwind CSS (sidebar dashboard layout, screenshot jaisa).
- **Deployment:** Vercel (recommend) + Supabase cloud.

---

## 9. High-Level Screens

1. Login
2. User Dashboard (credits + quick links)
3. AI Chat (with model selector + conversation list)
4. AI Writer
5. AI Code Generator
6. Templates grid
7. Admin — Users
8. Admin — Plans
9. Admin — Templates
10. Admin — Settings (API key, models)

---

## 10. Success Criteria (MVP done)

- Admin ek user bana sakta hai, plan + credits de sakta hai.
- User login karke Chat/Writer/Code/Templates use kar sakta hai ArgonMax K3 (+ others) ke saath.
- Credits sahi deduct hote hain aur khatam hone par block + upgrade CTA dikhta hai.
- Admin manually upgrade/credit top-up kar sakta hai.
- API key server-side secure hai.

---

## 11. Phase 2 (Future — abhi nahi)

- Self-signup + free plan.
- JVZoo/W+ auto-provisioning webhook (IPN).
- Chat with Documents (PDF/DOCX) — Kimi long context.
- Image understanding (ArgonMax Vision).
- Brand Voice.
- Multi-admin, affiliate system, team seats.
- Themes/white-label.
```
