"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Sparkles, Copy, Download, Check, ListChecks } from "lucide-react";
import Markdown from "@/components/Markdown";

interface Result {
  item: string;
  output: string;
}

const MAX_ITEMS = 20;

export default function BulkClient() {
  const router = useRouter();
  const [instruction, setInstruction] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const items = itemsText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  async function generate() {
    if (!instruction.trim() || items.length === 0 || loading) return;
    if (items.length > MAX_ITEMS) {
      setError(`Max ${MAX_ITEMS} items per run. You have ${items.length}.`);
      return;
    }
    setError(null);
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch("/api/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction, items }),
      });
      const data = await res.json();
      if (data.results) setResults(data.results);
      if (!res.ok) setError(data.error ?? "Request failed");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      router.refresh();
    }
  }

  function combinedText() {
    return results
      .map((r) => `## ${r.item}\n\n${r.output}`)
      .join("\n\n---\n\n");
  }

  function copyAll() {
    navigator.clipboard.writeText(combinedText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadTxt() {
    const blob = new Blob([combinedText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "argonmax-bulk.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg"
            style={{ backgroundImage: "linear-gradient(135deg,#f59e0b,#fb923c)" }}
          >
            <Layers size={18} />
          </span>
          <span className="text-gradient">Bulk Generation</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          One instruction, many items — generate for all at once. Use{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">{"{item}"}</code>{" "}
          in your instruction to place each item. Max {MAX_ITEMS} per run.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-surface/80 p-5 shadow-sm backdrop-blur">
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
            <Sparkles size={15} className="text-primary" /> Instruction
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={5}
            placeholder="e.g. Write a short product description for {item}"
            className="w-full resize-none rounded-xl border bg-surface-2 px-3.5 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="rounded-2xl border bg-surface/80 p-5 shadow-sm backdrop-blur">
          <label className="mb-1.5 flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2">
              <ListChecks size={15} className="text-primary" /> Items
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                items.length > MAX_ITEMS
                  ? "bg-red-500/15 text-red-400"
                  : "bg-primary/15 text-primary"
              }`}
            >
              {items.length}/{MAX_ITEMS}
            </span>
          </label>
          <textarea
            value={itemsText}
            onChange={(e) => setItemsText(e.target.value)}
            rows={5}
            placeholder={"iPhone 15 case\nWireless earbuds\nLaptop stand"}
            className="w-full resize-none rounded-xl border bg-surface-2 px-3.5 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={generate}
          disabled={loading || !instruction.trim() || items.length === 0}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-95 hover:shadow-primary/25 disabled:opacity-50"
          style={{ backgroundImage: "linear-gradient(135deg,#2f6bff,#22d3ee)" }}
        >
          <Sparkles size={16} />
          {loading ? `Generating ${items.length}…` : "Generate all"}
        </button>
        {results.length > 0 && (
          <>
            <button
              onClick={copyAll}
              className="flex items-center gap-1.5 rounded-xl border bg-surface px-3.5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-surface-2"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy all"}
            </button>
            <button
              onClick={downloadTxt}
              className="flex items-center gap-1.5 rounded-xl border bg-surface px-3.5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-surface-2"
            >
              <Download size={14} /> Download .txt
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {loading && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border bg-surface/70 px-4 py-3 text-sm text-muted backdrop-blur">
          <span className="thinking-spark">✦</span>
          Generating {items.length} items… this can take a bit.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {results.map((r, i) => (
          <div
            key={i}
            className="rounded-2xl border bg-surface/80 p-5 shadow-sm backdrop-blur"
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold text-white"
                style={{ backgroundImage: "linear-gradient(135deg,#2f6bff,#22d3ee)" }}
              >
                {i + 1}
              </span>
              <span className="text-primary">{r.item}</span>
            </h3>
            <Markdown content={r.output} />
          </div>
        ))}
      </div>
    </div>
  );
}
