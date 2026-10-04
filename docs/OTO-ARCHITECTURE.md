# ArgonMax — OTO / Entitlement Architecture

**Goal:** Build all 10 OTOs on top of the MVP. Everything is gated by the
buyer's **plan**, which the admin sets manually after each WarriorPlus/JVZoo
purchase. No payment webhooks.

Companion: `docs/OTO-FUNNEL.md` (business), `docs/OTO-TASKS.md` (build steps).

---

## 1. Core idea — Entitlements from the plan

Every capability is a flag/limit on the user's **plan**. When a buyer pays for
an OTO, admin switches their plan (or toggles a flag) and the app unlocks it.

```
profile ──has──> plan ──defines──> entitlements (flags + limits)
```

One helper resolves everything:

```ts
// lib/entitlements.ts
export interface Entitlements {
  unlimitedWords: boolean;
  templateLevel: number;   // 0 free · 1 bump · 2 premium(DFY)
  pro: boolean;            // PDF chat + vision + advanced tools
  bulk: boolean;           // bulk / batch generation
  traffic: boolean;        // training & lead-gen resources
  agency: boolean;         // can create client sub-accounts
  agencyAccounts: number;  // how many
  seats: number;           // team members under this account
  whitelabel: boolean;     // custom branding
  reseller: boolean;       // reseller resources
  vip: boolean;            // VIP training / coaching area
}
export function getEntitlements(profile): Entitlements
```

- **Server**: API routes call `getEntitlements()` and reject if a feature is off.
- **UI**: Sidebar/pages read entitlements to show, lock, or hide modules and
  render the correct upgrade CTA.

**Rule:** never trust the client. Every gated route re-checks server-side.

---

## 2. Database changes

### 2.1 `plans` — add entitlement columns
```sql
alter table public.plans
  add column is_unlimited     boolean not null default false,
  add column template_level   int     not null default 0,   -- 0/1/2
  add column feature_pro      boolean not null default false,
  add column feature_bulk     boolean not null default false,
  add column feature_traffic  boolean not null default false,
  add column is_agency        boolean not null default false,
  add column agency_accounts  int     not null default 0,
  add column seats            int     not null default 1,
  add column is_whitelabel    boolean not null default false,
  add column is_reseller      boolean not null default false,
  add column is_vip           boolean not null default false;
```

### 2.2 `templates` — add tiering
```sql
alter table public.templates
  add column tier int not null default 0;   -- 0 free · 1 bump · 2 premium
```
User sees a template when `template.tier <= plan.template_level`.

### 2.3 Agency / teams — parent-child accounts
```sql
alter table public.profiles
  add column parent_id uuid references public.profiles(id) on delete set null,
  add column is_sub_admin boolean not null default false;  -- agency owner
```
- Agency owner (`is_sub_admin`) can create child users (`parent_id = owner.id`)
  up to `agency_accounts`.
- Team seats: child users under a parent, capped by `seats`.

### 2.4 Branding (whitelabel)
```sql
create table public.branding (
  owner_id   uuid primary key references public.profiles(id) on delete cascade,
  app_name   text,
  logo_url   text,
  primary_color text,
  custom_domain text
);
```
Whitelabel/agency owner edits their branding; their sub-accounts see it.

---

## 3. Feature gating pattern

### Server (route handler)
```ts
const profile = await requireUser();
const ent = getEntitlements(profile);
if (!ent.pro) return NextResponse.json({ error: "Upgrade to Pro" }, { status: 402 });
```

### UI (sidebar / page)
```tsx
{ent.pro ? <Link href="/documents">Chat with PDF</Link>
         : <LockedItem label="Chat with PDF" upgradeUrl={plan.purchase_url} />}
```

### Words logic (Unlimited)
- `preCheckCredits`: if `ent.unlimitedWords` → always allow.
- `chargeWords`: if unlimited → still log usage, but do not decrement/block.
- `CreditBar`: show "Unlimited" instead of a number.

---

## 4. OTO → technical mapping

| OTO | Unlocks | Build effort |
|-----|---------|--------------|
| Bump | `template_level >= 1` | tiny (tier gating) |
| 1 Unlimited | `is_unlimited` | small (words logic) |
| 2 Pro | `feature_pro` → Documents(PDF), Vision, advanced code tools | **large** (new features) |
| 3 DFY | `template_level = 2` + premium templates | small (seed + gating) |
| 4 Automation | `feature_bulk` → Bulk generation page | medium |
| 5 Traffic | `feature_traffic` → Training/Resources page | small (content page) |
| 6 Agency | `is_agency` + sub-accounts + client manager | **large** (sub-admin role) |
| 7 Reseller | `is_reseller` → Reseller resources page | small |
| 8 Whitelabel | `is_whitelabel` → branding editor + domain | medium |
| 9 Franchise | `seats` → team members | medium |
| 10 VIP | `is_vip` → VIP training/coaching area | small |
| Bundle | all flags on | trivial (one plan) |

---

## 5. Admin changes

- **Plans form**: add all entitlement fields (toggles + numbers).
- **Users**: quick "assign plan" already exists; entitlements follow the plan.
- **Templates form**: add `tier` selector (Free / Bump / Premium).
- Optional per-user override flags later (not MVP of OTO phase).

---

## 6. New pages/modules to build

| Route | For | Notes |
|-------|-----|-------|
| `/documents` | OTO2 | Upload PDF/DOCX → chat over it (long context) |
| vision in `/chat` & `/code` | OTO2 | Image upload → send to vision model |
| `/bulk` | OTO4 | Multi-input / CSV batch generation + export |
| `/training` | OTO5, OTO10 | Video/PDF resources (content, flag-gated) |
| `/agency` | OTO6 | Create & manage client sub-accounts |
| `/reseller` | OTO7 | Download sales kit / license info |
| `/admin/branding` or `/branding` | OTO8 | Whitelabel branding editor |
| `/team` | OTO9 | Invite/manage team seats |

---

## 7. Guiding principles

1. One entitlement helper, used everywhere. No scattered checks.
2. Plan-driven; admin toggles = instant unlock (manual, no webhooks).
3. Server always re-validates; UI only hides/shows.
4. Locked features still visible as teasers with an upgrade CTA (drives OTO sales).
5. Ship OTOs incrementally — each phase is independently deployable.
