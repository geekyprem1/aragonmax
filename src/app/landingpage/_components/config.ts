/**
 * landingpage / _components / config.ts
 * -------------------------------------------------
 * ALL placeholders for the long-form sales page live here.
 * Replace the TODO values with real copy, links & media.
 * NOTE: never publish income claims you can't substantiate.
 */

export const LANDING_CONFIG = {
  productName: "ArgonMax AI",
  engine: "[PLACEHOLDER: your model stack — e.g. Powered by ArgonMax K3]",

  // TODO: paste your checkout / WarriorPlus / JVZoo / Stripe link here
  checkoutUrl: "#checkout",
  // TODO: paste your login/app link here
  loginUrl: "/login",
  // TODO: paste your demo video (YouTube / Loom / mp4) embed URL here
  demoVideoUrl: "#demo-video-placeholder",

  // TODO: set real pricing
  pricing: {
    strikePrice: "$497",
    todayPrice: "$47",
    billingNote: "[PLACEHOLDER: one-time / yearly — pick one, don't claim both]",
    normalValue: "$2,400/year [PLACEHOLDER]",
    guaranteeDays: 30,
  },

  contactEmail: "[PLACEHOLDER: support@yourdomain.com]",
} as const;

export const VALUE_STACK: { name: string; value: string }[] = [
  { name: "[PLACEHOLDER: AI Chat PRO — chat with ArgonMax K3 & more]", value: "$997" },
  { name: "[PLACEHOLDER: AI Writer — blogs, emails, ad copy in seconds]", value: "$497" },
  { name: "[PLACEHOLDER: Website & Funnel Builder — from one prompt]", value: "$997" },
  { name: "[PLACEHOLDER: Code Generator — apps, plugins, games]", value: "$497" },
  { name: "[PLACEHOLDER: Creative Studio — AI images & videos]", value: "$997" },
  { name: "[PLACEHOLDER: Chat with PDF — ask any document]", value: "$497" },
  { name: "[PLACEHOLDER: Bulk Generator — 100 outputs in one click]", value: "$497" },
  { name: "[PLACEHOLDER: Template Pack — ready-made expert personas]", value: "$297" },
  { name: "[PLACEHOLDER: Training & Traffic Resources]", value: "$497" },
  { name: "[PLACEHOLDER: Commercial License — sell what you create & keep 100%]", value: "$997" },
];

export const BONUSES = [
  {
    no: "FAST ACTION BONUS #1",
    title: "[PLACEHOLDER: e.g. 100 Killer AI Prompts]",
    desc: "[PLACEHOLDER: 2-line description of what they get + why it helps.]",
    value: "$197",
  },
  {
    no: "FAST ACTION BONUS #2",
    title: "[PLACEHOLDER: e.g. Digital Product Factory]",
    desc: "[PLACEHOLDER: 2-line description.]",
    value: "$197",
  },
  {
    no: "FAST ACTION BONUS #3",
    title: "[PLACEHOLDER: e.g. One Prompt, 10 Assets]",
    desc: "[PLACEHOLDER: 2-line description.]",
    value: "$147",
  },
  {
    no: "FAST ACTION BONUS #4",
    title: "[PLACEHOLDER: e.g. 50 Weekend AI Projects]",
    desc: "[PLACEHOLDER: 2-line description.]",
    value: "$147",
  },
  {
    no: "FAST ACTION BONUS #5",
    title: "[PLACEHOLDER: e.g. Client Sample Factory]",
    desc: "[PLACEHOLDER: 2-line description.]",
    value: "$147",
  },
];

export const TESTIMONIALS = [
  {
    quote: "[PLACEHOLDER testimonial 1 — replace with a REAL user result. Do not invent earnings.]",
    name: "[PLACEHOLDER: Name, Role]",
  },
  {
    quote: "[PLACEHOLDER testimonial 2 — replace with a REAL user result.]",
    name: "[PLACEHOLDER: Name, Role]",
  },
  {
    quote: "[PLACEHOLDER testimonial 3 — replace with a REAL user result.]",
    name: "[PLACEHOLDER: Name, Role]",
  },
];

export const FAQS = [
  {
    q: "Does ArgonMax AI work on any device?",
    a: "[PLACEHOLDER: Yes — it's cloud-based, works on Mac, PC, phone & tablet. Edit freely.]",
  },
  {
    q: "Is there a monthly fee?",
    a: "[PLACEHOLDER: Describe YOUR real billing: one-time / subscription. Don't claim both.]",
  },
  {
    q: "Do I need tech skills or experience?",
    a: "[PLACEHOLDER: No — pick a tool, follow the prompt, generate. Training included.]",
  },
  {
    q: "Can I use it for client work?",
    a: "[PLACEHOLDER: Explain YOUR commercial license terms honestly.]",
  },
  {
    q: "What if it doesn't work for me?",
    a: "[PLACEHOLDER: Explain your real refund policy, e.g. 30-day guarantee + how to claim.]",
  },
];
