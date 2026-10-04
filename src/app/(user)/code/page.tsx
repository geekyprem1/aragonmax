"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Code2, Sparkles, Copy, Check, Terminal } from "lucide-react";
import Markdown from "@/components/Markdown";

const PRESETS: { label: string; prompt: string; language?: string }[] = [
  {
    label: "Business Website",
    prompt:
      "Create a modern, fully responsive business website with a header/navbar, hero section, about, services, testimonials and a contact footer. Use semantic HTML, CSS and a little JavaScript.",
    language: "HTML",
  },
  {
    label: "Landing Page",
    prompt:
      "Create a high-converting product landing page with a hero, feature grid, testimonials, pricing table and a call-to-action. Use HTML and Tailwind CSS.",
    language: "HTML",
  },
  {
    label: "Portfolio Site",
    prompt:
      "Create a personal portfolio website with about, projects gallery, skills and contact sections. Responsive and clean design.",
    language: "HTML",
  },
  {
    label: "Login / Signup",
    prompt:
      "Create a login and signup form with tab switching, client-side validation and modern styling using HTML, CSS and JavaScript.",
    language: "HTML",
  },
  {
    label: "Contact Form",
    prompt:
      "Create a contact form with name, email and message fields, client-side validation and a success message. Nicely styled.",
    language: "HTML",
  },
  {
    label: "Admin Dashboard UI",
    prompt:
      "Create an admin dashboard UI with a sidebar, top navbar, stat cards and a data table. Responsive layout using HTML and CSS.",
    language: "HTML",
  },
  {
    label: "E-commerce Product Page",
    prompt:
      "Create an e-commerce product page with an image gallery, title, price, rating, quantity selector and an add-to-cart button.",
    language: "HTML",
  },
  {
    label: "Blog Template",
    prompt:
      "Create a clean blog homepage template with a header, featured post, a grid of post cards, sidebar and pagination.",
    language: "HTML",
  },
  {
    label: "REST API (Node.js)",
    prompt:
      "Create a REST API using Node.js and Express with full CRUD endpoints for a 'products' resource, including input validation.",
    language: "JavaScript",
  },
  {
    label: "Calculator App",
    prompt:
      "Create a fully working calculator web app with buttons for digits and operations, using HTML, CSS and JavaScript.",
    language: "JavaScript",
  },
];

export default function CodePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function applyPreset(p: (typeof PRESETS)[number]) {
    setPrompt(p.prompt);
    if (p.language) setLanguage(p.language);
  }

  async function generate() {
    if (!prompt.trim() || loading) return;
    setError(null);
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, language }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Request failed");
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
        setOutput(full);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      router.refresh();
    }
  }

  function copyAll() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col px-4 py-6 sm:px-8 sm:py-8">
      {/* Header */}
      <div className="mb-5 shrink-0">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg"
            style={{ backgroundImage: "linear-gradient(135deg,#14b8a6,#22d3ee)" }}
          >
            <Code2 size={18} />
          </span>
          <span className="text-gradient">AI Code Generator</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Describe what you need and get clean, working code in any language.
        </p>
      </div>

      {/* Preset templates */}
      <div className="mb-5 shrink-0">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted/70">
          Quick templates
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="rounded-full border bg-surface/70 px-3 py-1.5 text-xs text-muted backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-foreground"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="flex min-h-0 flex-col space-y-4 rounded-2xl border bg-surface/80 p-5 shadow-sm backdrop-blur">
          <div className="flex min-h-0 flex-1 flex-col">
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
              <Sparkles size={15} className="text-primary" /> Describe what code you need
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A responsive one-page About Us page in HTML and CSS"
              className="min-h-40 flex-1 resize-none rounded-xl border bg-surface-2 px-3.5 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 scrollbar-thin"
            />
          </div>
          <div className="shrink-0">
            <label className="mb-1.5 block text-sm font-medium">
              Coding language <span className="text-muted">(optional)</span>
            </label>
            <input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Java, Python, PHP etc."
              className="w-full rounded-xl border bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={generate}
            disabled={loading || !prompt.trim()}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-95 hover:shadow-primary/25 disabled:opacity-50"
            style={{ backgroundImage: "linear-gradient(135deg,#2f6bff,#22d3ee)" }}
          >
            <Sparkles size={16} />
            {loading ? "Generating…" : "Generate code"}
          </button>
          {error && (
            <p className="shrink-0 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Output */}
        <div className="flex min-h-0 flex-col rounded-2xl border bg-surface/80 p-5 shadow-sm backdrop-blur">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Terminal size={15} className="text-primary" /> Output
            </span>
            {output && (
              <button
                onClick={copyAll}
                className="flex items-center gap-1.5 rounded-lg border bg-surface px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-surface-2"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy all"}
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin pr-1">
            {output ? (
              <Markdown content={output} />
            ) : loading ? (
              <span className="flex items-center gap-2 text-sm text-muted">
                <span className="thinking-spark">✦</span>
                <span>ArgonMax is writing your code</span>
                <span className="thinking-dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </span>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
                  style={{ backgroundImage: "linear-gradient(135deg,#14b8a6,#2f6bff)" }}
                >
                  <Code2 size={22} />
                </span>
                <p className="text-sm font-medium">Your code will appear here</p>
                <p className="max-w-xs text-xs text-muted">
                  Pick a template or describe your idea, then hit Generate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
