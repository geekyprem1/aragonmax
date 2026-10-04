"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Template, TemplateCategory } from "@/types/db";

const categories: { key: TemplateCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "expert", label: "Experts" },
  { key: "writing", label: "Writing" },
  { key: "coding", label: "Coding" },
];

const tiers: { key: number | "all"; label: string }[] = [
  { key: "all", label: "All tiers" },
  { key: 0, label: "Free" },
  { key: 1, label: "🥈 Silver" },
  { key: 2, label: "🥇 Gold" },
];

/** Visual theme per tier: 2 = Gold, 1 = Silver, 0 = default. */
function tierStyle(tier: number) {
  if (tier === 2)
    return {
      card: "border-amber-400/40 hover:border-amber-400",
      icon: "bg-amber-400/15 text-amber-300",
      badge: "bg-amber-400/20 text-amber-300",
      label: "🥇 Gold",
    };
  if (tier === 1)
    return {
      card: "border-slate-400/40 hover:border-slate-300",
      icon: "bg-slate-400/15 text-slate-200",
      badge: "bg-slate-400/20 text-slate-200",
      label: "🥈 Silver",
    };
  return {
    card: "hover:border-primary",
    icon: "bg-primary/20 text-primary",
    badge: "",
    label: "",
  };
}

export default function TemplatesClient({
  templates,
  favoriteIds,
  userId,
  templateLevel,
  upgradeUrl,
}: {
  templates: Template[];
  favoriteIds: string[];
  userId: string;
  templateLevel: number;
  upgradeUrl?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<TemplateCategory | "all">("all");
  const [tierFilter, setTierFilter] = useState<number | "all">("all");
  const [favs, setFavs] = useState<Set<string>>(new Set(favoriteIds));

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchCat = cat === "all" || t.category === cat;
      const matchTier = tierFilter === "all" || t.tier === tierFilter;
      const matchQ =
        !query ||
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        (t.description ?? "").toLowerCase().includes(query.toLowerCase());
      return matchCat && matchTier && matchQ;
    });
  }, [templates, cat, tierFilter, query]);

  async function toggleFav(id: string) {
    const supabase = createClient();
    const next = new Set(favs);
    if (next.has(id)) {
      next.delete(id);
      await supabase.from("favorites").delete().eq("user_id", userId).eq("template_id", id);
    } else {
      next.add(id);
      await supabase.from("favorites").insert({ user_id: userId, template_id: id });
    }
    setFavs(next);
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <h1 className="mb-6 text-xl font-semibold text-gradient">Templates</h1>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates…"
          className="w-64 rounded-lg border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                cat === c.key
                  ? "bg-primary text-white"
                  : "border text-muted hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tier filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tiers.map((t) => (
          <button
            key={t.key}
            onClick={() => setTierFilter(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tierFilter === t.key
                ? "bg-primary text-white"
                : "border text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((t) => {
          const style = tierStyle(t.tier);
          const locked = t.tier > templateLevel;

          if (locked) {
            return (
              <div
                key={t.id}
                className={`relative rounded-xl border border-dashed bg-surface p-5 text-center opacity-95 ${style.card}`}
              >
                {style.label && (
                  <span
                    className={`absolute right-3 top-3 rounded px-1.5 py-0.5 text-[10px] ${style.badge}`}
                  >
                    {style.label}
                  </span>
                )}
                <div
                  className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-lg ${style.icon}`}
                >
                  🔒
                </div>
                <h3 className="font-medium">{t.name}</h3>
                <p className="mt-1 text-xs text-muted">{t.description}</p>
                {upgradeUrl ? (
                  <a
                    href={upgradeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-hover"
                  >
                    Unlock
                  </a>
                ) : (
                  <span className="mt-3 inline-block text-xs text-muted">
                    Upgrade to unlock
                  </span>
                )}
              </div>
            );
          }

          return (
            <div
              key={t.id}
              className={`relative rounded-xl border bg-surface p-5 text-center transition-colors ${style.card}`}
            >
              {style.label && (
                <span
                  className={`absolute right-3 top-3 rounded px-1.5 py-0.5 text-[10px] ${style.badge}`}
                >
                  {style.label}
                </span>
              )}
              <button
                onClick={() => toggleFav(t.id)}
                className="absolute left-3 top-3 text-lg"
                title="Favorite"
              >
                <span className={favs.has(t.id) ? "text-yellow-400" : "text-muted"}>
                  ★
                </span>
              </button>
              <Link href={`/chat?t=${t.id}`} className="block">
                <div
                  className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-sm font-semibold ${style.icon}`}
                >
                  {t.icon ?? t.name.slice(0, 2).toUpperCase()}
                </div>
                <h3 className="font-medium">{t.name}</h3>
                <p className="mt-1 text-xs text-muted">{t.description}</p>
              </Link>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted">
            No templates found.
          </p>
        )}
      </div>
    </div>
  );
}
