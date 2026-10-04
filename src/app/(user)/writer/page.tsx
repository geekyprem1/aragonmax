"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";

type Template = {
  key: string;
  name: string;
  icon: string;
  category: string;
  desc: string;
  // Prompt scaffold — {input} is replaced with the user's brief.
  prompt: (input: string) => string;
  placeholder: string;
};

const CATEGORIES = [
  "All",
  "Social Media",
  "Marketing",
  "Blogging",
  "SEO",
  "Email Writing",
  "YouTube",
  "Business",
  "Ecommerce",
  "Creative Writing",
  "Productivity",
] as const;

const TEMPLATES: Template[] = [
  {
    key: "instagram-captions",
    name: "Instagram Captions",
    icon: "📸",
    category: "Social Media",
    desc: "Scroll-stopping captions with hashtags",
    placeholder: "e.g. A new organic skincare serum launch",
    prompt: (i) =>
      `Write 5 engaging Instagram captions for: ${i}. Each caption should be punchy, include relevant emojis, a call-to-action, and 5-8 trending hashtags. Number them 1-5.`,
  },
  {
    key: "facebook-posts",
    name: "Facebook Posts",
    icon: "👍",
    category: "Social Media",
    desc: "Engaging posts that drive interaction",
    placeholder: "e.g. Weekend sale on running shoes",
    prompt: (i) =>
      `Write 3 engaging Facebook posts about: ${i}. Make them conversational, include a hook, value, and a clear call-to-action. Add relevant emojis.`,
  },
  {
    key: "linkedin-posts",
    name: "LinkedIn Posts",
    icon: "💼",
    category: "Social Media",
    desc: "Professional posts that build authority",
    placeholder: "e.g. Lessons learned from scaling a startup",
    prompt: (i) =>
      `Write a professional LinkedIn post about: ${i}. Start with a strong hook, use short punchy lines, share a valuable insight or story, and end with a question to drive engagement. Add 3-5 relevant hashtags.`,
  },
  {
    key: "twitter-posts",
    name: "X (Twitter) Posts",
    icon: "🐦",
    category: "Social Media",
    desc: "Viral tweets and threads",
    placeholder: "e.g. Productivity tips for founders",
    prompt: (i) =>
      `Write a viral X (Twitter) thread about: ${i}. Start with a scroll-stopping hook tweet, then 5-7 concise, high-value tweets. Number each tweet. Keep each under 280 characters.`,
  },
  {
    key: "threads-posts",
    name: "Threads Posts",
    icon: "🧵",
    category: "Social Media",
    desc: "Casual, engaging Threads content",
    placeholder: "e.g. Behind the scenes of my business",
    prompt: (i) =>
      `Write 3 engaging Threads posts about: ${i}. Keep them casual, authentic, and conversational with a hook and light emojis.`,
  },
  {
    key: "tiktok-captions",
    name: "TikTok Captions",
    icon: "🎵",
    category: "Social Media",
    desc: "Catchy captions for short videos",
    placeholder: "e.g. A quick 10-second recipe reel",
    prompt: (i) =>
      `Write 5 catchy TikTok captions for a short video about: ${i}. Keep them short, fun, trend-aware, with emojis and 4-6 trending hashtags. Number them 1-5.`,
  },
  {
    key: "pinterest-descriptions",
    name: "Pinterest Descriptions",
    icon: "📌",
    category: "Social Media",
    desc: "SEO-friendly pin descriptions",
    placeholder: "e.g. Minimalist home office setup ideas",
    prompt: (i) =>
      `Write 3 SEO-friendly Pinterest pin descriptions for: ${i}. Include keywords naturally, a helpful tone, and a call-to-action. Add relevant hashtags.`,
  },
  {
    key: "viral-hooks",
    name: "Viral Hooks",
    icon: "🔥",
    category: "Social Media",
    desc: "Attention-grabbing opening lines",
    placeholder: "e.g. A course teaching AI to beginners",
    prompt: (i) =>
      `Write 10 scroll-stopping viral hooks for content about: ${i}. Make them curiosity-driven, bold, and impossible to ignore. Number them 1-10.`,
  },
  {
    key: "blog-post",
    name: "Blog Post",
    icon: "📝",
    category: "Blogging",
    desc: "Full SEO blog article",
    placeholder: "e.g. How to start a podcast in 2026",
    prompt: (i) =>
      `Write a complete, well-structured SEO blog post about: ${i}. Include an engaging intro, H2/H3 subheadings, actionable content, and a conclusion. Use markdown formatting.`,
  },
  {
    key: "blog-intro",
    name: "Blog Intro",
    icon: "✍️",
    category: "Blogging",
    desc: "Compelling article openings",
    placeholder: "e.g. The future of remote work",
    prompt: (i) =>
      `Write 3 compelling blog post introductions about: ${i}. Each should hook the reader immediately and set up the article. Number them 1-3.`,
  },
  {
    key: "meta-description",
    name: "SEO Meta Description",
    icon: "🔍",
    category: "SEO",
    desc: "Click-worthy meta descriptions",
    placeholder: "e.g. Best budget laptops for students",
    prompt: (i) =>
      `Write 5 SEO meta descriptions (under 160 characters each) for a page about: ${i}. Make them click-worthy and keyword-rich. Number them 1-5.`,
  },
  {
    key: "keywords",
    name: "SEO Keywords",
    icon: "🎯",
    category: "SEO",
    desc: "Keyword ideas and clusters",
    placeholder: "e.g. Home fitness equipment",
    prompt: (i) =>
      `Generate a list of 20 SEO keywords for: ${i}. Group them into short-tail and long-tail keyword clusters with search intent noted.`,
  },
  {
    key: "cold-email",
    name: "Cold Email",
    icon: "📧",
    category: "Email Writing",
    desc: "Outreach emails that get replies",
    placeholder: "e.g. Offering web design services to local restaurants",
    prompt: (i) =>
      `Write a short, persuasive cold outreach email for: ${i}. Include a strong subject line, personalized hook, clear value proposition, and a soft call-to-action.`,
  },
  {
    key: "newsletter",
    name: "Newsletter",
    icon: "📬",
    category: "Email Writing",
    desc: "Engaging email newsletters",
    placeholder: "e.g. Weekly AI tools roundup",
    prompt: (i) =>
      `Write an engaging email newsletter about: ${i}. Include a catchy subject line, a warm intro, 3 value sections with subheadings, and a closing call-to-action.`,
  },
  {
    key: "youtube-script",
    name: "YouTube Script",
    icon: "🎬",
    category: "YouTube",
    desc: "Full video scripts",
    placeholder: "e.g. 5 mistakes new investors make",
    prompt: (i) =>
      `Write a YouTube video script about: ${i}. Include a strong 15-second hook, an intro, clearly segmented main points, and an outro with a call-to-action to subscribe.`,
  },
  {
    key: "youtube-titles",
    name: "YouTube Titles & Desc",
    icon: "▶️",
    category: "YouTube",
    desc: "Clickable titles + descriptions",
    placeholder: "e.g. A tutorial on editing videos with AI",
    prompt: (i) =>
      `Write 5 high-CTR YouTube titles and one optimized video description (with timestamps placeholders and hashtags) for a video about: ${i}. Number the titles 1-5.`,
  },
  {
    key: "ad-copy",
    name: "Ad Copy",
    icon: "📢",
    category: "Marketing",
    desc: "High-converting ads",
    placeholder: "e.g. A meal-prep subscription box",
    prompt: (i) =>
      `Write 3 high-converting ad copy variations for: ${i}. Each should include a headline, primary text, and a call-to-action. Focus on benefits and urgency.`,
  },
  {
    key: "sales-copy",
    name: "Sales Page Copy",
    icon: "💰",
    category: "Marketing",
    desc: "Persuasive sales sections",
    placeholder: "e.g. An online course on freelancing",
    prompt: (i) =>
      `Write persuasive sales page copy for: ${i}. Include a headline, subheadline, problem/agitation, solution, key benefits (bullets), and a strong call-to-action.`,
  },
  {
    key: "product-description",
    name: "Product Description",
    icon: "🛍️",
    category: "Ecommerce",
    desc: "Compelling product listings",
    placeholder: "e.g. A stainless steel insulated water bottle",
    prompt: (i) =>
      `Write a compelling e-commerce product description for: ${i}. Include an attention-grabbing headline, benefit-focused paragraph, and 4-5 feature bullet points.`,
  },
  {
    key: "story",
    name: "Short Story",
    icon: "📖",
    category: "Creative Writing",
    desc: "Creative short-form stories",
    placeholder: "e.g. A lighthouse keeper who finds a message in a bottle",
    prompt: (i) =>
      `Write a captivating short story based on: ${i}. Use vivid descriptions, a clear arc, and an engaging ending.`,
  },
  {
    key: "summary",
    name: "Summarizer",
    icon: "📋",
    category: "Productivity",
    desc: "Summarize any text",
    placeholder: "Paste the text you want summarized…",
    prompt: (i) =>
      `Summarize the following clearly into key points and a short paragraph:\n\n${i}`,
  },
  {
    key: "business-idea",
    name: "Business Ideas",
    icon: "💡",
    category: "Business",
    desc: "Brainstorm business concepts",
    placeholder: "e.g. Sustainable products for pet owners",
    prompt: (i) =>
      `Generate 5 detailed business ideas around: ${i}. For each, give a name, one-line concept, target audience, and how it makes money.`,
  },
];

const TONES = ["professional", "casual", "friendly", "bold", "witty", "persuasive", "inspirational"];

export default function WriterPage() {
  const router = useRouter();
  const [category, setCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Template | null>(null);
  const [input, setInput] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const inCat = category === "All" || t.category === category;
      const q = search.trim().toLowerCase();
      const inSearch =
        !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
      return inCat && inSearch;
    });
  }, [category, search]);

  function pick(t: Template) {
    setSelected(t);
    setOutput("");
    setError(null);
    setInput("");
  }

  async function generate() {
    if (!selected || !input.trim() || loading) return;
    setError(null);
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selected.prompt(input.trim()),
          tone,
          length,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Request failed");
      else setOutput(data.output);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      router.refresh();
    }
  }

  function copyOutput() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex h-full">
      {/* Left: template picker */}
      <div className="hidden w-80 shrink-0 flex-col border-r bg-surface md:flex">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">Choose a Template</h2>
          <p className="text-xs text-muted">Select an AI template to get started.</p>
        </div>

        <div className="px-4 pt-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                  category === c
                    ? "border-primary bg-primary text-white"
                    : "text-muted hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex-1 space-y-2 overflow-y-auto px-4 pb-4 scrollbar-thin">
          {filtered.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted">
              No templates found.
            </p>
          )}
          {filtered.map((t) => (
            <button
              key={t.key}
              onClick={() => pick(t)}
              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                selected?.key === t.key
                  ? "border-primary bg-primary/10"
                  : "hover:bg-surface-2"
              }`}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{t.name}</span>
                <span className="block truncate text-xs text-muted">{t.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: workspace */}
      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-thin">
        <div className="border-b px-6 py-4">
          <h1 className="text-lg font-semibold text-gradient">AI Writer</h1>
          <p className="text-xs text-muted">
            {selected ? selected.name : "Pick a template to start writing"}
          </p>
        </div>

        {/* Mobile template selector */}
        <div className="border-b px-6 py-3 md:hidden">
          <select
            value={selected?.key ?? ""}
            onChange={(e) => {
              const t = TEMPLATES.find((x) => x.key === e.target.value);
              if (t) pick(t);
            }}
            className="w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
          >
            <option value="">Choose a template…</option>
            {TEMPLATES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.icon} {t.name}
              </option>
            ))}
          </select>
        </div>

        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="" className="mb-4 h-12 w-12 opacity-80" />
            <p className="text-lg font-medium text-foreground">
              What can I write for you today?
            </p>
            <p className="mt-1 max-w-sm text-sm">
              Choose a template from the left to generate captions, posts, blogs,
              emails, ads and more.
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-5 px-6 py-6">
            <div className="rounded-xl border bg-surface p-5">
              <label className="mb-1 flex items-center gap-2 text-sm font-medium">
                <span>{selected.icon}</span> {selected.name}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={5}
                placeholder={selected.placeholder}
                className="mt-2 w-full resize-none rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Length</label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value as typeof length)}
                    className="w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
                  >
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </div>
              </div>
              <button
                onClick={generate}
                disabled={loading || !input.trim()}
                className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? "Generating…" : "Generate ✨"}
              </button>
              {error && (
                <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}
            </div>

            <div className="rounded-xl border bg-surface p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted">Output</span>
                {output && (
                  <button
                    onClick={copyOutput}
                    className="text-xs text-primary hover:underline"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>
              <div className="min-h-48 text-sm">
                {loading ? (
                  <span className="flex items-center gap-2 text-muted">
                    <span className="thinking-spark">✦</span>
                    <span>Writing</span>
                    <span className="thinking-dots">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </span>
                ) : output ? (
                  <Markdown content={output} />
                ) : (
                  <span className="text-muted">Your content will appear here.</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
