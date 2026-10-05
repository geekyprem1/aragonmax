"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AiModel, Build } from "@/types/db";

type BuildType = {
  key: string;
  label: string;
  language: string;
  ext: string;
  placeholder: string;
  prompt: (idea: string) => string;
};

const TYPES: BuildType[] = [
  {
    key: "website",
    label: "Websites",
    language: "HTML",
    ext: "html",
    placeholder:
      "e.g. A modern real estate website with property listings, agent profiles, mortgage calculator, and a contact form",
    prompt: (i) =>
      `Build a complete, production-ready responsive website: ${i}. Deliver a single self-contained HTML file using Tailwind CSS (via CDN) and vanilla JavaScript. Include a navbar, hero, feature sections, testimonials, pricing, FAQ and footer. Modern design, smooth scrolling, and fully responsive. Return only the full HTML in one code block.`,
  },
  {
    key: "funnel",
    label: "Funnels",
    language: "HTML",
    ext: "html",
    placeholder:
      "e.g. A lead-gen sales funnel for an online fitness coaching program with an opt-in and a checkout CTA",
    prompt: (i) =>
      `Build a high-converting sales funnel page: ${i}. Deliver a single self-contained HTML file with Tailwind CSS (CDN). Include an attention hook headline, benefits, social proof, an opt-in/lead form, urgency element, and a strong call-to-action button. Conversion-focused, clean, responsive. Return only the full HTML in one code block.`,
  },
  {
    key: "game",
    label: "Games",
    language: "JavaScript",
    ext: "html",
    placeholder:
      "e.g. A Bubble Shooter game with smooth animations, colorful graphics, power-ups and multiple levels",
    prompt: (i) =>
      `Build a complete, playable browser game: ${i}. Deliver a single self-contained HTML file using HTML canvas and vanilla JavaScript. Include game loop, controls, scoring, and simple animations. Make it responsive and fun to play. Return only the full HTML in one code block.`,
  },
  {
    key: "app",
    label: "Apps",
    language: "JavaScript",
    ext: "html",
    placeholder:
      "e.g. A to-do app with categories, due dates, dark mode and localStorage persistence",
    prompt: (i) =>
      `Build a complete, working web app: ${i}. Deliver a single self-contained HTML file with Tailwind CSS (CDN) and vanilla JavaScript. Include full interactivity, state management, and localStorage persistence where useful. Clean UI, responsive. Return only the full HTML in one code block.`,
  },
  {
    key: "blog",
    label: "Blog",
    language: "HTML",
    ext: "html",
    placeholder:
      "e.g. A minimalist tech blog homepage with featured post, article grid and a newsletter signup",
    prompt: (i) =>
      `Build a complete blog website: ${i}. Deliver a single self-contained HTML file using Tailwind CSS (CDN). Include a header, featured post, a grid of article cards, a sidebar, a newsletter signup and a footer. Clean, readable typography and responsive layout. Return only the full HTML in one code block.`,
  },
];

function typeFromKey(key: string): BuildType {
  return TYPES.find((t) => t.key === key) ?? TYPES[0];
}

/** Pull raw code out of markdown code fences; fall back to the whole text. */
function extractCode(md: string): string {
  const blocks = [...md.matchAll(/```[\w-]*\n?([\s\S]*?)```/g)].map((m) => m[1]);
  if (blocks.length) {
    // Multiple blocks: use the largest (the single-file project), not a join.
    return blocks.reduce((a, b) => (b.length > a.length ? b : a)).trim();
  }
  // Truncated output: a fenced block with no closing fence — take the rest.
  const open = md.match(/```[\w-]*\n([\s\S]*)$/);
  if (open) return open[1].trim();
  return md.trim();
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "project"
  );
}

type Turn = {
  role: "user" | "assistant";
  idea?: string;
  code?: string; // assistant: raw generated output
  building?: boolean;
  typeKey?: string;
};

export default function BuildClient({
  models,
  defaultModel,
  userId,
  initialBuilds,
}: {
  models: AiModel[];
  defaultModel: string;
  userId: string;
  initialBuilds: Build[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [builds, setBuilds] = useState<Build[]>(initialBuilds);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [type, setType] = useState<BuildType>(TYPES[0]);
  const [model, setModel] = useState(defaultModel);
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);

  function newBuild() {
    setActiveId(null);
    setTurns([]);
    setIdea("");
    setError(null);
    setShowList(false);
  }

  function openBuild(b: Build) {
    setActiveId(b.id);
    setType(typeFromKey(b.type));
    if (b.model && models.some((m) => m.model_key === b.model)) setModel(b.model);
    setTurns([
      { role: "user", idea: b.idea ?? "" },
      { role: "assistant", code: b.output ?? "", building: false, typeKey: b.type },
    ]);
    setIdea("");
    setError(null);
    setShowList(false);
  }

  async function deleteBuild(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this build?")) return;
    await supabase.from("builds").delete().eq("id", id);
    setBuilds((b) => b.filter((x) => x.id !== id));
    if (activeId === id) newBuild();
  }

  async function build() {
    const text = idea.trim();
    if (!text || loading) return;
    setError(null);
    setLoading(true);
    setActiveId(null);

    const currentType = type;
    setTurns((t) => [
      ...t,
      { role: "user", idea: text },
      { role: "assistant", building: true, typeKey: currentType.key },
    ]);
    setIdea("");

    try {
      const res = await fetch("/api/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentType.prompt(text),
          language: currentType.language,
          model,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Request failed");
        setTurns((t) => t.slice(0, -1)); // drop the pending assistant turn
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
      }

      setTurns((t) => {
        const copy = [...t];
        copy[copy.length - 1] = {
          role: "assistant",
          code: full,
          building: false,
          typeKey: currentType.key,
        };
        return copy;
      });

      if (full) {
        const { data } = await supabase
          .from("builds")
          .insert({
            user_id: userId,
            title: text.slice(0, 60),
            type: currentType.key,
            model,
            idea: text,
            output: full,
          })
          .select("id, user_id, title, type, model, idea, output, created_at")
          .single();
        if (data) {
          setBuilds((b) => [data as Build, ...b]);
          setActiveId((data as Build).id);
        }
      }
    } catch {
      setError("Network error");
      setTurns((t) => t.slice(0, -1));
    } finally {
      setLoading(false);
      router.refresh();
    }
  }

  const empty = turns.length === 0;

  return (
    <div className="relative flex h-full">
      {/* Mobile backdrop */}
      {showList && (
        <div
          className="absolute inset-0 z-10 bg-black/50 md:hidden"
          onClick={() => setShowList(false)}
        />
      )}

      {/* History sidebar */}
      <div
        className={`${
          showList ? "absolute z-20 flex" : "hidden"
        } inset-y-0 left-0 w-64 flex-col border-r bg-surface md:static md:z-auto md:flex`}
      >
        <div className="p-3">
          <button
            onClick={newBuild}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            + New build
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3 scrollbar-thin">
          {builds.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted">
              No saved builds yet.
            </p>
          )}
          {builds.map((b) => (
            <div
              key={b.id}
              onClick={() => openBuild(b)}
              className={`group flex cursor-pointer items-start justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                activeId === b.id
                  ? "bg-primary/15 text-foreground"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate">{b.title}</span>
                <span className="block text-[11px] text-muted/70">
                  {typeFromKey(b.type).label} ·{" "}
                  {new Date(b.created_at).toLocaleDateString()}
                </span>
              </span>
              <button
                onClick={(e) => deleteBuild(b.id, e)}
                className="hidden text-xs text-red-400 group-hover:block"
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b px-4 py-3 sm:px-6">
          <button
            onClick={() => setShowList(true)}
            className="rounded-lg border px-2.5 py-1.5 text-xs text-muted hover:text-foreground md:hidden"
          >
            History
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gradient">Build</h1>
            <p className="text-xs text-muted">From one idea to a full product.</p>
          </div>
        </div>

        {/* Conversation / hero */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-thin">
          {empty ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/favicon.png" alt="" className="mb-4 h-14 w-14 opacity-90" />
              <h2 className="text-2xl font-semibold sm:text-3xl">
                From One Idea To A Full{" "}
                <span className="text-primary">Product.</span>
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted">
                Build websites, sales funnels, blogs, apps and games — powered by
                ArgonMax AI.
              </p>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6">
              {turns.map((t, i) =>
                t.role === "user" ? (
                  <div key={i} className="text-right">
                    <div className="inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-2.5 text-left text-sm text-white">
                      {t.idea}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      AI
                    </div>
                    <div className="min-w-0 flex-1">
                      {t.building ? (
                        <span className="flex items-center gap-2 text-sm text-muted">
                          <span className="thinking-spark">✦</span>
                          <span>
                            Building your {typeFromKey(t.typeKey ?? "website").label.toLowerCase()}
                          </span>
                          <span className="thinking-dots">
                            <span>.</span>
                            <span>.</span>
                            <span>.</span>
                          </span>
                        </span>
                      ) : (
                        <BuildResult
                          code={t.code ?? ""}
                          type={typeFromKey(t.typeKey ?? "website")}
                          idea={turns[i - 1]?.idea ?? "project"}
                        />
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setType(t)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    type.key === t.key
                      ? "border-primary bg-primary text-white"
                      : "text-muted hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border bg-surface p-3">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    build();
                  }
                }}
                rows={2}
                placeholder={type.placeholder}
                className="w-full resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="rounded-lg border bg-surface-2 px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                >
                  {models.map((m) => (
                    <option key={m.model_key} value={m.model_key}>
                      {m.display_name}
                      {m.badge ? ` · ${m.badge}` : ""}
                    </option>
                  ))}
                </select>
                <button
                  onClick={build}
                  disabled={loading || !idea.trim()}
                  className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {loading ? "Building…" : "Build ↑"}
                </button>
              </div>
            </div>
            {error && (
              <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BuildResult({
  code,
  type,
  idea,
}: {
  code: string;
  type: BuildType;
  idea: string;
}) {
  const [showCode, setShowCode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  function download() {
    const content = extractCode(code);
    const blob = new Blob([content], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(idea)}.${type.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-2xl border bg-surface px-4 py-3 text-sm">
      <p className="font-medium">Generation completed successfully.</p>
      <p className="text-muted">Your files are ready to download.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={download}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover"
        >
          ⬇ Download Project
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className="text-xs text-primary hover:underline"
        >
          Live preview
        </button>
        <button
          onClick={() => setShowCode((v) => !v)}
          className="text-xs text-muted hover:text-foreground"
        >
          {showCode ? "Hide code" : "View code"}
        </button>
      </div>
      {showCode && (
        <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-surface-2 p-3 text-xs scrollbar-thin">
          <code>{extractCode(code)}</code>
        </pre>
      )}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Generated preview">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm text-white">
            <span className="min-w-0 truncate">
              Live preview · sandboxed (scripts run isolated from your account)
            </span>
            <button
              onClick={() => setShowPreview(false)}
              className="shrink-0 rounded-lg border border-white/30 px-3 py-1.5 text-xs hover:bg-white/10"
            >
              Close
            </button>
          </div>
          {/* No allow-same-origin: generated scripts run in an opaque origin
              and cannot read app cookies, storage or the parent DOM. */}
          <iframe
            title="Generated preview"
            sandbox="allow-scripts allow-forms allow-popups allow-modals"
            srcDoc={extractCode(code)}
            className="h-full w-full flex-1 rounded-xl border bg-white"
          />
        </div>
      )}
    </div>
  );
}
