# ArgonMax — OTO Build TODO (phase by phase)

Build order is chosen so the **highest-converting, lowest-effort OTOs ship
first**. Each phase is independently deployable. Refs: `OTO-ARCHITECTURE.md`,
`OTO-FUNNEL.md`.

Legend: ⬜ todo · 🟦 in progress · ✅ done

---

## Phase A — Entitlement foundation (do this first) ✅ DONE
Enables everything else. No OTO works cleanly without it.

- ✅ A1. Migration: add entitlement columns to `plans` (0006_entitlements.sql)
- ✅ A2. Migration: add `tier` to `templates` (0006_entitlements.sql)
- ✅ A3. `lib/entitlements.ts` — `getEntitlements` + `pickEntitlements`
- ✅ A4. Admin → Plans form: entitlement toggles + numbers
- ✅ A5. Admin → Templates form: `tier` selector (Free/Bump/Premium)
- ✅ A6. `components/LockedItem.tsx` (teaser + upgrade CTA)
- ✅ A7. Seed funnel plan presets (FE + OTO1-10 + Bundle)

**Note:** entitlements are stored on BOTH plans (presets) and profiles
(effective, source of truth). Assigning a plan (`apply_plan`) copies presets
to the profile; per-user toggles in Admin > Users let you stack OTO purchases.

## Phase B — OTO1 Unlimited  💰 ✅ DONE
- ✅ B1. `preCheckCredits`: bypass when `is_unlimited`
- ✅ B2. `chargeWords`: logs usage but never decrements when unlimited
- ✅ B3. `CreditBar`: shows "∞ Unlimited"
- ✅ B4. Wired `unlimited` flag through chat/writer/code routes

## Phase C — OTO3 DFY + Order Bump  ✅ DONE
- ✅ C1. Seeded 30 premium templates (`tier = 2`) — 0007_premium_templates.sql
- ✅ C2. Seeded 12 bump templates (`tier = 1`)
- ✅ C3. Templates gated by `tier <= profile.template_level`
- ✅ C4. Locked templates show as teasers + Unlock CTA
- ✅ C5. Chat URL guarded — locked personas cannot be used via `?t=`

## Phase D — OTO5 Traffic + OTO10 VIP + OTO7 Reseller  ✅ DONE
- ✅ D1. `/training` page gated by `feature_traffic` or `is_vip` (VIP section extra)
- ✅ D2. `resources` table + Admin > Resources CRUD (0008_resources.sql)
- ✅ D3. `/reseller` page gated by `is_reseller`
- ✅ D4. Sidebar shows Training/Reseller links only when entitled

## Phase E — OTO4 Automation / Bulk  ✅ DONE
- ✅ E1. `/bulk` page: instruction + items list (one per line, {item} placeholder)
- ✅ E2. `/api/bulk` route: loops items (max 20), credits per item, stops if empty
- ✅ E3. Batch export: Copy all + Download .txt
- ✅ E4. Gated by `feature_bulk` (page + API) + sidebar link

## Phase F — OTO2 Pro / Advanced AI  ✅ DONE
- ✅ F1. `/documents`: PDF (pdfjs) + TXT extraction client-side
- ✅ F2. `/api/documents/chat`: long-context Q&A over the file (streaming)
- ✅ F3. Vision: image upload in Chat → vision model (📎 button, Pro only)
- ✅ F4. Advanced code tools available via coding templates (Reviewer/Refactor/Tests)
- ✅ F5. Gated by `feature_pro` (pages + APIs + sidebar links)
- ✅ F6. `KIMI_VISION_MODEL` env (blank = vision disabled gracefully)

## Phase G — OTO8 Whitelabel  ✅ DONE
- ✅ G1. `branding` table (0009_branding.sql) + RLS (own + parent)
- ✅ G2. `/branding` editor (app name, logo, color, domain)
- ✅ G3. Branding applied in user layout (name/logo in sidebar + primary color)
- ✅ G4. Custom domain guide (docs/WHITELABEL.md)
- ✅ G5. Gated by `is_whitelabel` (page + API + sidebar link)

## Phase H — OTO6 Agency + OTO9 Team Seats  ✅ DONE
- ✅ H1. Migration: `parent_id`, `is_sub_admin`, `member_type` + RLS (0010_agency.sql)
- ✅ H2. `/agency` page: create/manage client accounts (cap `agency_accounts`)
- ✅ H3. `/team` page: manage team members (cap `seats - 1`)
- ✅ H4. Sub-accounts inherit parent branding (layout uses parent_id)
- ✅ H5. Gated by `is_agency` / `seats > 1` (pages + API + sidebar links)

## Phase I — Bundle + polish  ✅ DONE
- ✅ I1. All-Access Bundle plan (all flags) seeded in 0006
- ✅ I2. Downsell plans (Unlimited/DFY/Agency Lite) seeded in 0011
- ✅ I3. Global `upgrade_url` setting + Admin field; all Upgrade CTAs use it
- ✅ I4. Entitlement gating verified via build across all OTO pages
- ✅ I5. Build passes clean

## 🎉 All phases complete
Front-end + 10 OTOs + Bundle are implemented and gated by entitlements.
Fulfillment is manual via Admin > Users > Features (or assign a plan preset).

---

## Suggested shipping milestones
1. **A + B + C** → sell FE + Unlimited + DFY + Bump (fastest revenue).
2. **D** → Traffic, VIP, Reseller (content OTOs).
3. **E** → Automation.
4. **F** → Pro (the big feature upsell).
5. **G + H** → Whitelabel, Agency, Team (high-ticket).
6. **I** → Bundle + polish.

We build one phase at a time, test, deploy, then move on.
