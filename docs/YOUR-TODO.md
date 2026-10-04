# ArgonMax — Tumhe Kya Kya Karna Hai (Action Checklist)

Ye tumhari step-by-step to-do list hai. Upar se neeche follow karo.

---

## 1. Supabase setup (database)
- [ ] https://supabase.com pe project banao (ya jo bana hua hai use karo).
- [ ] **SQL Editor** mein `supabase/migrations/` ki saari files **numeric order** mein run karo (ek-ek karke, ek baar):
  - [ ] 0001_schema.sql
  - [ ] 0002_functions.sql
  - [ ] 0003_rls.sql
  - [ ] 0004_seed.sql
  - [ ] 0005_templates.sql
  - [ ] 0006_entitlements.sql
  - [ ] 0007_premium_templates.sql
  - [ ] 0008_resources.sql
  - [ ] 0009_branding.sql
  - [ ] 0010_agency.sql
  - [ ] 0011_funnel_polish.sql
  - [ ] 0012_creative_studio.sql
- [ ] **Project Settings → API** se copy karo: Project URL, anon key, service_role key.

## 2. Apna admin account banao (ek baar)
- [ ] Supabase → **Authentication → Users → Add user** (email + password, Auto Confirm tick).
- [ ] User ka UID copy karo, phir SQL Editor mein chalao (UID + email badlo):
```sql
insert into public.profiles (id, email, role, words_remaining, status)
values ('YAHA-UID', 'tumhara@email.com', 'admin', 999999999, 'active')
on conflict (id) do update set role = 'admin';
```

## 3. Vercel pe deploy + env vars
- [ ] Vercel pe repo import karo (GitHub: <your-github-repo>) — auto Next.js detect.
- [ ] **Settings → Environment Variables** mein daalo:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `MOONSHOT_API_KEY` (tumhari OpenRouter key)
  - [ ] `MOONSHOT_BASE_URL` = `https://openrouter.ai/api/v1`
  - [ ] `KIMI_MODELS` = pura JSON (ek line mein)
  - [ ] `KIMI_DEFAULT_MODEL` = `kimi-k3`
  - [ ] `KIMI_VISION_MODEL` = vision model (vision chahiye to), warna khaali
  - [ ] `REPLICATE_API_TOKEN` = Creative Studio (image+video) ke liye
  - [ ] `REPLICATE_IMAGE_MODEL` = `openai/gpt-image-2`
  - [ ] `REPLICATE_VIDEO_MODEL` = `prunaai/p-video`
  - [ ] `NEXT_PUBLIC_APP_NAME` = `ArgonMax`
  - [ ] `NEXT_PUBLIC_APP_URL` = tumhara vercel domain
- [ ] Deploy dabao.

## 4. OpenRouter setup
- [ ] https://openrouter.ai/settings/privacy pe jaake **prompt logging/training toggle ON** karo (warna deepseek model 404 dega).
- [ ] Credits/billing add karo (API calls ke liye).
- [ ] Model IDs confirm karo https://openrouter.ai/models pe — `KIMI_MODELS` ke `real` sahi hone chahiye.

## 5. Admin panel config (login karke)
- [ ] **Admin → Settings**:
  - [ ] Brand identity prompt check/edit (model naam kabhi na bataye).
  - [ ] **Upgrade URL** set karo (tumhari sales/OTO page ka link).
- [ ] **Admin → Plans**: har plan ka **purchase_url** apne JVZoo/W+ link se set karo (prices bhi adjust).
- [ ] **Admin → Resources**: sample links (example.com) ko apne asli video/PDF/kit URLs se replace karo (training, VIP, reseller).
- [ ] **Admin → Templates**: chaho to aur templates add karo ya tier badlo.

## 6. Test flow (sab OTO check karo)
- [ ] Ek test user banao (**Admin → Users → New user**).
- [ ] Us user pe **Features** button se ek-ek flag on karke check karo:
  - [ ] Unlimited → words khatam nahi hote, "∞ Unlimited" dikhe.
  - [ ] Template level 2 → premium templates unlock.
  - [ ] Pro → "Chat with PDF" + image button.
  - [ ] Bulk → "Bulk Generator" page.
  - [ ] Traffic/VIP → "Training" page.
  - [ ] Reseller → "Reseller" page.
  - [ ] Whitelabel → "Branding" page (naam/logo/color badle).
  - [ ] Agency → "Agency" page (client accounts).
  - [ ] Seats > 1 → "Team" page.
- [ ] Ya seedha koi **plan assign** karo (preset auto-apply hota hai).

## 7. Content bharo (bechne se pehle)
- [ ] Training videos / PDF banao aur Resources mein daalo.
- [ ] Reseller kit (sales page + swipes) ready karo.
- [ ] Vision model set karo (agar image feature bechna hai).
- [ ] Premium template outputs test karo.

## 8. WarriorPlus / JVZoo funnel setup
- [ ] FE + har OTO ke liye product/price banao (docs/OTO-FUNNEL.md dekho).
- [ ] Buyer pay kare → tumhe email aaye → **manually** us user ka plan/feature upgrade karo.
- [ ] Sales page + OTO pages banao (abhi app mein nahi hai — ye alag banana hai).

## 9. Baad ke liye (optional, jab chaho — mujhe bolna)
- [ ] **Sales/landing page** (sabse zaroori — asli sale isse aati hai).
- [ ] JVZoo/W+ **auto-provisioning webhook** (abhi 100% manual).
- [ ] Export to PDF/DOCX.
- [ ] Zyada models / vision fallback.
- [ ] Scanned PDF ke liye OCR.

---

## Quick reference — docs
- `SETUP.md` — technical setup
- `docs/PRD.md` — product requirements
- `docs/ARCHITECTURE.md` — technical architecture
- `docs/OTO-FUNNEL.md` — funnel + pricing plan
- `docs/OTO-ARCHITECTURE.md` — entitlement system design
- `docs/OTO-TASKS.md` — build progress (sab ✅)
- `docs/WHITELABEL.md` — whitelabel/domain guide
