import type { Metadata } from "next";
import CountdownTimer from "./_components/CountdownTimer";
import FaqAccordion from "./_components/FaqAccordion";
import StickyBuyBar from "./_components/StickyBuyBar";
import { BONUSES, LANDING_CONFIG, TESTIMONIALS, VALUE_STACK } from "./_components/config";

export const metadata: Metadata = {
  title: 'ArgonMax AI — Unlock The "Do-It-All" AI Platform [PLACEHOLDER]',
  description:
    "[PLACEHOLDER: sales page meta description for ArgonMax AI long-form landing page.]",
};

/* ── Big classic sales-page CTA button (yellow, like the reference) ── */
function Cta({
  label = "Get Started With This Revolutionary New Software Today",
}: {
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <a
        href={LANDING_CONFIG.checkoutUrl}
        className="block w-full max-w-xl rounded-2xl bg-gradient-to-b from-yellow-300 to-orange-500 px-8 py-5 text-center text-lg font-black uppercase leading-tight text-black shadow-[0_10px_35px_rgba(249,115,22,0.5)] transition hover:brightness-105 active:translate-y-px sm:text-2xl"
      >
        {label} →
      </a>
      <p className="text-[11px] font-semibold text-slate-500">
        [PLACEHOLDER: one-time payment • no monthly fee • instant access]
      </p>
    </div>
  );
}

function H2({ children, red = false }: { children: React.ReactNode; red?: boolean }) {
  return (
    <h2
      className={`text-center text-2xl font-black uppercase leading-tight sm:text-4xl ${
        red ? "text-red-600" : "text-slate-900"
      }`}
    >
      {children}
    </h2>
  );
}

function P({ children, center = true }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p
      className={`mt-4 text-sm leading-relaxed text-slate-700 sm:text-base ${
        center ? "mx-auto max-w-2xl text-center" : ""
      }`}
    >
      {children}
    </p>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* ══ 1. TOP URGENCY BAR (red) ═════════════════════════ */}
      <div className="border-b-4 border-yellow-400 bg-red-700 px-4 py-3">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3">
          <p className="text-center text-sm font-black uppercase tracking-wide text-white sm:text-base">
            ⚠️ Hurry! [PLACEHOLDER: Free commercial license expires in…]
          </p>
          <CountdownTimer compact />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-24">
        {/* ══ 2. HERO ══════════════════════════════════════════ */}
        <header className="pt-10 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-red-600">
            [PLACEHOLDER: pre-headline — e.g. Warning: everything on this page was
            created with AI]
          </p>
          <h1 className="mt-4 text-3xl font-black leading-tight text-slate-900 sm:text-5xl">
            ArgonMax AI Is Here: Unlock The{" "}
            <span className="text-blue-600">&quot;Do-It-All&quot; AI Platform</span> That
            Replaces Your{" "}
            <span className="text-red-600">Entire AI Toolbox</span>
          </h1>
          <P>
            <strong>[PLACEHOLDER: sub-headline — money hook in 2 lines.]</strong>
            <br />
            [PLACEHOLDER: E.g. Chat, write, code, build websites, generate
            images &amp; videos — from ONE cloud dashboard. Then sell what you
            create &amp; keep 100% of the profits with the included commercial
            license.]
          </P>
          <div className="mt-8">
            <Cta />
          </div>

          {/* Dashboard mock placeholder */}
          <div className="mt-8 rounded-3xl border-4 border-dashed border-slate-300 bg-slate-50 p-8">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">
              [Hero image / dashboard screenshot placeholder — 1200×675]
            </p>
            <div className="mx-auto mt-3 grid max-w-lg grid-cols-3 gap-3 text-[11px]">
              {["★★★★★ [RATING]", "👥 [USER COUNT]", "⚡ [UPTIME / SPEED]"].map((t) => (
                <div key={t} className="rounded-xl bg-slate-200 px-3 py-2 font-semibold text-slate-600">
                  {t}
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ══ 3. WHAT YOU CAN DO (strip) ══════════════════════ */}
        <section className="mt-12">
          <P>
            With ArgonMax AI you can <strong>create &amp; sell</strong> [edit
            this list to your real tools]:
          </P>
          <ul className="mx-auto mt-4 max-w-xl space-y-2 text-left text-sm font-semibold text-slate-800">
            {[
              "Unlimited unique content for any niche",
              "Websites, funnels & apps from one prompt",
              "AI images & videos for social media",
              "Code for plugins, tools & games",
              "eBooks, ad copy & email swipes",
              "Client-ready assets for your agency",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="text-green-600">✔</span> {t}
              </li>
            ))}
          </ul>
          <P>
            And here&apos;s the kicker:{" "}
            <strong className="text-red-600">
              you get all of this with just ONE low fee today
            </strong>{" "}
            [PLACEHOLDER: match your real billing].
          </P>
          <div className="mt-8">
            <Cta />
          </div>
        </section>

        {/* ══ 4. PAIN: monthly AI bills ═══════════════════════ */}
        <section className="mt-14">
          <H2 red>Have You Ever Looked At Your Monthly AI Bills &amp; Felt Sick?</H2>
          <P>
            It could be the <strong>$20/month</strong> for ChatGPT… the extra
            $49/month for an image tool… $30/month for a video maker… $20/month
            for a coding assistant…
          </P>
          <P>
            Until now you had <strong>two terrible options</strong>: pay
            hundreds per month to big corporations… or settle for the slow,
            restricted free versions while everyone else cashes in.
          </P>
          <P>
            <strong className="text-blue-600">
              Starting today, there&apos;s another, better, faster, cheaper
              option.
            </strong>{" "}
            It&apos;s called <strong>ArgonMax AI</strong>. [PLACEHOLDER: 2–3
            lines of your real story/positioning — why you built this.]
          </P>
          <div className="mt-8">
            <Cta />
          </div>
        </section>

        {/* ══ 5. 3 STEPS ═══════════════════════════════════════ */}
        <section className="mt-14">
          <H2>It Only Takes 3 Steps</H2>
          <div className="mt-8 space-y-4">
            {[
              {
                s: "Step #1",
                t: "Log In To The ArgonMax Cloud Dashboard",
                d: "[PLACEHOLDER: nothing to set up or configure — hosting included, works on any device: Mac, PC, tablet, phone.]",
              },
              {
                s: "Step #2",
                t: "Insert Your Text Prompt & Pick A Tool",
                d: "[PLACEHOLDER: chat, writer, build, code, image or video — be as vague or specific as you want, the AI figures out the rest.]",
              },
              {
                s: "Step #3",
                t: "Watch ArgonMax Turn Your Prompt Into Reality",
                d: "[PLACEHOLDER: it only takes seconds — export, publish, or sell to clients and keep 100% of the profit.]",
              },
            ].map((c) => (
              <div
                key={c.s}
                className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6 text-center"
              >
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">{c.s}</p>
                <h3 className="mt-2 text-lg font-black">{c.t}</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                  ({c.d})
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Cta />
          </div>
        </section>

        {/* ══ 6. DEMO VIDEO ════════════════════════════════════ */}
        <section className="mt-14">
          <H2 red>Watch Our Quick Demo Video &amp; See For Yourself…</H2>
          <a
            href={LANDING_CONFIG.demoVideoUrl}
            className="mt-8 block rounded-3xl border-4 border-dashed border-slate-300 bg-slate-900 p-14 text-center"
          >
            <p className="text-5xl text-white">▶</p>
            <p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-400">
              [Demo video placeholder — YouTube / Loom / mp4]
            </p>
            <p className="mx-auto mt-2 max-w-md text-xs text-slate-400">
              TODO: 2–3 min walkthrough — chat → writer → image → website.
            </p>
          </a>
          <div className="mt-8">
            <Cta />
          </div>
        </section>

        {/* ══ 7. MONEY-MAKING: turn words into sellable assets ══ */}
        <section className="mt-14">
          <H2>Turn Your Words Into <span className="text-red-600">Sellable</span> Assets</H2>
          <P>
            While everyone else is <em>using</em> AI… almost{" "}
            <strong className="text-red-600">nobody is profiting</strong> from it.
            ArgonMax AI is built for the second group —{" "}
            <strong>the sellers</strong>:
          </P>
          <ul className="mx-auto mt-4 max-w-xl space-y-2 text-left text-sm font-semibold text-slate-800">
            {[
              "Sell AI content, copy & ebooks on Fiverr/Upwork [PLACEHOLDER]",
              "Build & flip websites and funnels for clients [PLACEHOLDER]",
              "Run a social media content agency with images & video [PLACEHOLDER]",
              "Ship plugins, tools & code for local businesses [PLACEHOLDER]",
              "Plug ANY affiliate link & generate campaigns for it [PLACEHOLDER]",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="text-blue-600">➤</span> {t}
              </li>
            ))}
          </ul>
          <P>
            <strong>
              [PLACEHOLDER: income context line — e.g. &quot;freelancers charge
              $50–$500 for assets you can generate in minutes&quot; — only claim
              what you can back up.]
            </strong>
          </P>
          <div className="mt-8">
            <Cta />
          </div>
        </section>

        {/* ══ 8. OUTPUT SHOWCASE ═══════════════════════════════ */}
        <section className="mt-14">
          <H2 red>Just Take A Look At What ArgonMax Can Create</H2>
          <p className="mt-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
            [PLACEHOLDER: note — all media below was 100% generated with ArgonMax
            AI. Replace with REAL outputs only.]
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              "PROMPT: fitness influencer creative [IMG]",
              "PROMPT: tailor shop flyer [IMG]",
              "PROMPT: bakery opening invite [IMG]",
              "PROMPT: jewelry listing image [IMG]",
              "PROMPT: reel video for TikTok [VIDEO]",
              "PROMPT: landing page copy [TEXT]",
              "PROMPT: WP plugin code [CODE]",
              "PROMPT: kids book page [IMG]",
            ].map((t) => (
              <div
                key={t}
                className="grid min-h-40 place-items-center rounded-2xl border-4 border-dashed border-slate-300 bg-slate-50 p-4 text-center text-[11px] font-semibold text-slate-500"
              >
                {t}
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Cta />
          </div>
        </section>

        {/* ══ 9. WHAT IT'S NOT ═════════════════════════════════ */}
        <section className="mt-14">
          <H2>Here&apos;s What ArgonMax AI Is NOT:</H2>
          <ul className="mx-auto mt-6 max-w-xl space-y-2 text-left text-sm font-semibold text-slate-800">
            {[
              "No complex software to install",
              "No paying yearly fees for other tools",
              "No learning curve",
              "No experience needed",
              "No designers, coders or freelancers required",
              "No waiting on slow, restricted free versions",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="font-black text-red-600">✘</span> {t}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Cta />
          </div>
        </section>

        {/* ══ 10. VALUE STACK + PRICE ══════════════════════════ */}
        <section id="checkout" className="mt-14">
          <H2 red>Let&apos;s Review: Here&apos;s Exactly What You&apos;re Getting Today:</H2>
          <div className="mt-8 overflow-hidden rounded-2xl border-2 border-slate-200">
            {VALUE_STACK.map((v, i) => (
              <div
                key={v.name}
                className={`flex items-center justify-between gap-4 px-5 py-3 text-sm ${
                  i % 2 ? "bg-white" : "bg-slate-50"
                }`}
              >
                <p className="font-semibold text-slate-800">
                  <span className="text-green-600">✓</span> {v.name}
                </p>
                <span className="shrink-0 font-mono text-xs font-bold text-slate-500">
                  Value {v.value}!
                </span>
              </div>
            ))}
            <div className="bg-blue-600 px-5 py-4 text-center">
              <p className="text-sm font-black uppercase text-white">
                Total value you get today: [PLACEHOLDER: $X,XXX]!
              </p>
            </div>
          </div>

          {/* Pricing box */}
          <div className="mt-8">
            <P>
              If you bought all these tools separately, you&apos;d easily pay{" "}
              <strong>{LANDING_CONFIG.pricing.normalValue}</strong> [PLACEHOLDER
              — add up honestly].
            </P>
            <P>
              <strong>But you&apos;re NOT paying that today.</strong>
            </P>
          </div>
          <div className="mx-auto mt-8 max-w-xl rounded-3xl border-4 border-yellow-400 bg-gradient-to-b from-slate-50 to-white p-8 text-center shadow-[0_0_60px_rgba(250,204,21,0.35)]">
            <p className="text-xs font-black uppercase tracking-widest text-red-600">
              [PLACEHOLDER: launch special — one-time only]
            </p>
            <p className="mt-3 text-lg font-bold text-slate-400 line-through">
              {LANDING_CONFIG.pricing.strikePrice}
            </p>
            <p className="text-6xl font-black text-red-600">
              {LANDING_CONFIG.pricing.todayPrice}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {LANDING_CONFIG.pricing.billingNote}
            </p>
            <div className="mt-5 flex justify-center">
              <CountdownTimer />
            </div>
            <div className="mt-5">
              <Cta label="Click Here To Claim Your Special Discount Now" />
            </div>
          </div>
        </section>

        {/* ══ 11. BONUSES ══════════════════════════════════════ */}
        <section className="mt-14">
          <H2 red>
            Bonuses So Loaded, Saying No Feels Like Leaving Money On The Table…
          </H2>
          <div className="mt-8 space-y-4">
            {BONUSES.map((b) => (
              <div
                key={b.no}
                className="overflow-hidden rounded-2xl border-2 border-purple-200 bg-purple-50"
              >
                <div className="bg-purple-600 px-5 py-2 text-center text-xs font-black uppercase tracking-widest text-white">
                  {b.no}
                </div>
                <div className="p-6 text-center">
                  <div className="mx-auto grid min-h-24 max-w-xs place-items-center rounded-xl border-4 border-dashed border-purple-300 bg-white p-4 text-center text-[11px] font-semibold text-purple-400">
                    [BONUS COVER PLACEHOLDER — 600×400]
                  </div>
                  <h3 className="mt-4 text-lg font-black">{b.title}</h3>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
                    {b.desc}
                  </p>
                  <p className="mt-2 font-mono text-xs font-bold text-slate-500">
                    Value {b.value}!
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Cta />
          </div>
        </section>

        {/* ══ 12. TESTIMONIALS ═════════════════════════════════ */}
        <section className="mt-14">
          <H2>Here&apos;s What Our Users Have To Say:</H2>
          <div className="mt-8 space-y-4">
            {TESTIMONIALS.map((t, i) => (
              <figure
                key={i}
                className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6"
              >
                <p className="text-yellow-500">★★★★★ [PLACEHOLDER]</p>
                <blockquote className="mt-3 text-sm italic leading-relaxed text-slate-700">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 flex items-center justify-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">
                    [IMG]
                  </span>
                  <span className="text-xs font-black uppercase tracking-wide text-slate-800">
                    {t.name}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] text-slate-500">
            [PLACEHOLDER compliance note: only publish real, verifiable reviews
            with permission. No income claims without proof + disclaimer.]
          </p>
          <div className="mt-8">
            <Cta />
          </div>
        </section>

        {/* ══ 13. GUARANTEE ════════════════════════════════════ */}
        <section className="mt-14">
          <div className="overflow-hidden rounded-3xl border-4 border-green-500 bg-green-50">
            <div className="bg-green-600 px-5 py-3 text-center">
              <p className="text-sm font-black uppercase tracking-widest text-white">
                Guaranteed Or Your Money Back — 100% Risk Free
              </p>
            </div>
            <div className="p-8 text-center">
              <p className="text-6xl">🛡️</p>
              <h3 className="mt-3 text-2xl font-black text-green-800">
                {LANDING_CONFIG.pricing.guaranteeDays}-Day Money-Back Guarantee
                [PLACEHOLDER]
              </h3>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-700">
                [PLACEHOLDER: write YOUR real guarantee in 4–5 lines. E.g. Try
                ArgonMax AI for 30 days. If you hit a technical problem we
                can&apos;t fix, email {LANDING_CONFIG.contactEmail} and get a
                full refund — no tricks, no hassle.]
              </p>
              <p className="mx-auto mt-5 max-w-xl text-left text-sm leading-relaxed text-slate-600">
                <strong>P.S.</strong> [PLACEHOLDER: we know there are a lot of
                overpriced tools out there… so test this 100% risk-free.]
                <br />
                <strong>P.P.S.</strong> [PLACEHOLDER: don&apos;t procrastinate —
                the launch price disappears and it will cost more than double
                later.]
              </p>
              <div className="mt-6">
                <Cta label="Don't Procrastinate — Take Action NOW" />
              </div>
            </div>
          </div>
        </section>

        {/* ══ 14. FAQ ═══════════════════════════════════════════ */}
        <section className="mt-14">
          <H2>Frequently Asked Questions</H2>
          <div className="mt-8">
            <FaqAccordion />
          </div>
          <div className="mt-8">
            <Cta label="Yes — I Want ArgonMax AI Now" />
          </div>
        </section>

        {/* ══ 15. FOOTER ═══════════════════════════════════════ */}
        <footer className="mt-14 border-t-4 border-slate-200 pt-8 pb-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-500">
            {[
              "Refund Policy [LINK]",
              "Earnings Disclaimer [LINK]",
              "Privacy Policy [LINK]",
              "Terms of Use [LINK]",
              "Affiliate Compensation [LINK]",
              "Anti-Spam [LINK]",
              "Contact Us [LINK]",
            ].map((l) => (
              <a key={l} href="#" className="hover:underline">
                {l}
              </a>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-slate-500">
            © 2026 {LANDING_CONFIG.productName} | All Rights Reserved. | Support:{" "}
            {LANDING_CONFIG.contactEmail}
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-[10px] leading-relaxed text-slate-400">
            [PLACEHOLDER disclaimer: results are not typical and vary with
            effort; AI outputs need human review before commercial use;
            ArgonMax AI is not affiliated with or endorsed by OpenAI, Google or
            any third-party brand; trademarks belong to their owners.]
          </p>
        </footer>
      </div>

      <StickyBuyBar />
    </main>
  );
}
