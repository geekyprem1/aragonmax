# ArgonMax — Sales Funnel & OTO Plan (WarriorPlus / JVZoo)

**Status:** Planning doc (implement later)
**Model:** Front-End + 10 OTOs + Bundle + Order Bump + Downsells
**Delivery:** 100% manual via Admin panel (plans + tiers + feature flags)

> Pricing based on real 2026 AI-SaaS launches on WarriorPlus/JVZoo
> (AI Coaching Brain, StoreFluence AI, Claud Hub, Synthetic AI, Agentic Agency).
> Adjust to your audience. All prices are one-time launch prices.

---

## Funnel at a glance

| # | Offer | Price | One-line promise |
|---|-------|-------|------------------|
| FE | ArgonMax Commercial | $17 | All-in-one ArgonMax K3 AI app |
| Bump | Template Mega Pack | $9.95 | +30 bonus templates at checkout |
| OTO1 | Unlimited Pro | $47 | Unlimited words + advanced AI (PDF chat, vision, long context) |
| OTO2 | Creative PRO (Gold) | $87 | AI image + video creation (Gold tier) |
| OTO3 | DFY Pack | $67 | 100+ premium templates + campaigns |
| OTO4 | Automation / Bulk | $39 | Generate in bulk, save hours |
| OTO5 | Traffic / Leads | $47 | Traffic + lead-gen system |
| OTO6 | Agency | $97 | Sell sub-accounts to clients |
| OTO7 | Reseller | $67 | Sell ArgonMax, keep 100% |
| OTO8 | Whitelabel | $197 | Your own brand & domain |
| OTO9 | Franchise / Enterprise | $127 | Team seats + high limits |
| OTO10 | VIP DFY + Coaching | $97 | We set it up + train you |
| Bundle | Everything Bundle | $247-297 | FE + all OTOs, big saving |

**Downsell rule:** every OTO gets a lite/cheaper version if the buyer clicks "No".

**Downsell summary:**

| OTO | Downsell | DS Price |
|-----|----------|----------|
| OTO1 Unlimited Pro | Unlimited Pro Lite | $27 |
| OTO2 Creative PRO (Gold) | Creative PRO Silver | $47 |
| OTO3 DFY Pack | DS DFY Lite | $37 |
| OTO4 Automation | DS Automation Lite | $27 |
| OTO5 Traffic | DS Traffic Lite | $27 |
| OTO6 Agency | DS Agency Lite | $67 |
| OTO7 Reseller | DS Reseller Lite | $47 |
| OTO8 Whitelabel | DS Whitelabel Lite | $97 |
| OTO9 Enterprise | DS Enterprise Lite | $77 |
| OTO10 VIP | DS VIP Lite | $47 |

---

## FRONT-END — ArgonMax Commercial ($17)

**Promise:** One dashboard for AI chat, writing and code — powered by ArgonMax K3.

**What's included:**
- AI Chat (ArgonMax K3 + other models), with saved chat history
- AI Writer + AI Code Generator (with 10 quick code templates)
- 60+ ready-made templates / expert personas
- Commercial license (use output for clients)
- Limited monthly words (e.g. 15,000-20,000)

**Delivery:** Default "Commercial" plan on signup. Already built.

**Goal:** Low price, high volume. This is the door — the real money is in OTOs.

---

## ORDER BUMP — Template Mega Pack ($9.95)

**Promise:** Add 30 extra premium templates to your account right now.

**What's included:** A curated bundle of 30 niche/premium templates unlocked instantly.

**Delivery:** Tag these templates `tier = bump`; unlock when the bump flag is on the profile.

**Goal:** Easy yes at checkout. Lifts average order value with near-zero effort.

---

## OTO1 — Unlimited Pro ($47)  ⭐ highest converter

**Promise:** Remove all word limits AND unlock ArgonMax's most powerful tools — in one upgrade.

**What's included:**
- Unlimited (or very high, e.g. 1,000,000–2,000,000) monthly words
- Access to the fastest/best model + priority generation
- Chat with Documents (upload PDF/DOCX, ask questions) — ArgonMax K3 long-context USP
- Image understanding (upload a screenshot → get code/description) — ArgonMax Vision
- Extra-long context mode
- Advanced code tools (code review, refactor, tests)

**Delivery:** "Unlimited Pro" plan with huge `monthly_words` + `feature_pro = true` flag. Admin upgrades after purchase.

**Why it sells:** Combines the #1 upsell (no limits) with the highest-value power features — one easy yes.

**Downsell ($27):** "Unlimited Pro Lite" — 200,000 words + Chat-with-PDF only (no vision).

---

## OTO2 — Creative PRO ($87 Gold / $47 Silver DS)

**Promise:** Add AI image + video creation to ArgonMax.

**What's included:**
- AI image generation (multiple aspect ratios)
- 10-second AI video generation (720p)
- Saved gallery
- One-time credits (not monthly), separate from words

**Tiers:**
- 🥇 **Gold ($87)** — main OTO — 500 image + 50 video credits (one-time)
- 🥈 **Silver ($47)** — downsell — 150 image + 25 video credits (one-time)

**Delivery:** `feature_media = true` flag; consumables `image_credits` / `video_credits`. Video locked to 10s / 720p to keep cost predictable.

**Needs building:** `REPLICATE_API_TOKEN` (+ model env). Set purchase URLs in Admin > Plans.

**Downsell ($47):** Creative PRO Silver — 150 image + 25 video credits instead of Gold's 500/50.

---

## OTO3 — DFY Pack ($67)

**Promise:** Done-for-you templates and full campaigns — no writing skills needed.

**What's included:**
- 100+ premium templates NOT in the front-end
- Ready-made full campaigns (email sequences, sales funnels, ad sets)
- Niche packs (real estate, coaching, e-commerce, local biz)

**Delivery:** Templates tagged `tier = premium`; unlocked for DFY buyers.

**Needs building:** `tier` column on templates + gating by plan.

**Downsell ($37):** 40 templates instead of 100+.

---

## OTO4 — Automation / Bulk ($39)

**Promise:** Create in bulk and save hours.

**What's included:**
- Bulk generation (paste a list / upload CSV → get many outputs)
- Batch export (download all as a zip / doc)
- Save & reuse prompt presets

**Delivery:** `feature_bulk = true` flag.

**Needs building:** Bulk input UI + queued generation + batch export.

**Downsell ($27):** Bulk limited to 10 items per run.

---

## OTO5 — Traffic / Leads ($47)

**Promise:** Get traffic and leads to actually use the tool profitably.

**What's included:**
- Traffic training (video course / PDF)
- Lead-generation templates & scripts
- Optional: a simple lead-capture / opt-in template pack

**Delivery:** Mostly content (training area + templates). Add a `feature_traffic` flag for a "Training" page.

**Needs building:** A simple training/resources page (links to videos/PDFs).

**Downsell ($27):** Training only, no lead templates.

---

## OTO6 — Agency ($97)

**Promise:** Run an AI agency — create accounts for clients and charge them.

**What's included:**
- Ability to create/manage 50-100 sub-accounts
- Client management view
- Agency commercial rights

**Delivery:** "Agency" plan. MVP: you (admin) create client accounts on their behalf, or build a limited sub-admin role.

**Needs building (for full self-serve):** sub-account / limited-admin role.

**Downsell ($67):** 25 sub-accounts instead of 100.

---

## OTO7 — Reseller ($67)

**Promise:** Sell ArgonMax itself and keep 100% of every sale.

**What's included:**
- Reseller license to sell ArgonMax accounts
- Ready sales page, email swipes, graphics
- Support handled by you (the vendor)

**Delivery:** License grant + a delivery folder (sales assets). Mostly a rights/paperwork OTO — little code.

**Downsell ($47):** Reseller for a limited number of licenses.

---

## OTO8 — Whitelabel ($197)

**Promise:** Put your own brand on the whole app.

**What's included:**
- Custom app name, logo, colors
- Custom domain
- Remove ArgonMax branding

**Delivery:** App name/logo already env-driven. Add per-instance branding config + domain setup guide.

**Needs building:** Branding settings (name, logo, colors) + domain instructions.

**Downsell ($97):** Branding only (name + logo), no custom domain help.

---

## OTO9 — Franchise / Enterprise ($127)

**Promise:** Full power for teams and serious users.

**What's included:**
- Team seats (5-10 users under one account)
- Highest word/usage limits
- Priority support

**Delivery:** "Enterprise" plan + seat support.

**Needs building (for full):** multi-seat / team accounts.

**Downsell ($77):** 3 seats instead of 10.

---

## OTO10 — VIP DFY Setup + Coaching ($97)

**Promise:** We set everything up for you and show you how to profit.

**What's included:**
- Personal onboarding / setup call
- Live group training + Q&A
- Private community access
- Priority support

**Delivery:** Support tier flag + access to a private group/training area. Almost no code — high margin.

**Downsell ($47):** Recorded training only (no live/community).

---

## BUNDLE — Everything Bundle ($247-297)

**Promise:** Get the front-end and every upgrade in one payment and save $500+.

**What's included:** FE + OTO1-10 unlocked together.

**Delivery:** A single "Bundle / All-Access" plan that flips every feature flag + max words + all tiers.

**Why it matters:** A large share of buyers purchase the bundle directly. Always offer it.

---

## Creative PRO (Image + Video) — now OTO2

Moved into **OTO2 — Creative PRO** above. Gold ($87) is the main OTO, Silver ($47) is its downsell.

AI image (gpt-image-2, low quality) + video (p-video, 10s/720p) via Replicate.
Credits are **one-time** (not monthly), separate from words.

| Tier | Role | Price | Images | Videos | Your API cost (max) | Net after 60% cut |
|------|------|-------|--------|--------|--------------------|-------------------|
| Creative PRO Silver | DS | $47 | 150 | 25 | ~$8 | ~$18.80 → profit ~$11 |
| Creative PRO Gold | main | $87 | 500 | 50 | ~$20 | ~$34.80 → profit ~$15 |

- Gated by `feature_media`; consumables `image_credits` / `video_credits`.
- Video locked to 10s / 720p to keep cost predictable.
- Needs `REPLICATE_API_TOKEN` (+ model env). Set purchase URLs in Admin > Plans.

## Delivery architecture (build later)

To make all OTOs manageable from the admin panel, add to the `plans`/`profiles` model:

- `tier` on templates: `free | bump | premium`
- Feature flags on plan: `feature_pro`, `feature_bulk`, `feature_traffic`, `whitelabel`, `agency`, `seats`
- Word limit already exists (`monthly_words` / `words_remaining`)

Then each purchase = admin sets the buyer's plan (or toggles flags). Manual, simple, no webhooks.

**Suggested build order when ready:**
1. `tier` column + template gating (enables Bump, DFY)
2. Feature-flag gating in UI (enables Pro, Bulk, Traffic)
3. Chat-with-PDF + vision (OTO2 core value)
4. Whitelabel branding settings (OTO8)
5. Sub-accounts / seats (OTO6, OTO9)

---

## Sources
Pricing patterns referenced from public 2026 launch pricing pages
(content rephrased for licensing compliance):
- AI Coaching Brain — https://otoslinks.com/ai-coaching-brain-oto-otos-upsells/
- StoreFluence AI — https://otoslinks.com/storefluence-ai-oto-links-upsells/
- Claud Hub — https://otoslinks.com/claud-hub-oto-otos-upsells/
- Synthetic AI — https://otoslinks.com/synthetic-ai-oto-bundle-deal/
- Agentic Agency — https://otoslinks.com/agentic-agency-bundle-deal-oto/
