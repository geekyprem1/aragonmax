"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Template, TemplateCategory } from "@/types/db";

type Draft = {
  id?: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  system_prompt: string;
  is_active: boolean;
  tier: number;
};

const empty: Draft = {
  name: "",
  description: "",
  category: "expert",
  icon: "",
  system_prompt: "",
  is_active: true,
  tier: 0,
};

const TIER_LABELS = ["Free", "Bump", "Premium (DFY)"];

export default function AdminTemplatesClient({
  templates,
}: {
  templates: Template[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    if (!draft) return;
    setMsg(null);
    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(data.error ?? "Failed");
    setDraft(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/admin/templates?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function toggle(t: Template) {
    await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        icon: t.icon,
        system_prompt: t.system_prompt,
        is_active: !t.is_active,
        tier: t.tier,
      }),
    });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Templates</h1>
        <button
          onClick={() => setDraft({ ...empty })}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + New template
        </button>
      </div>

      {msg && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {msg}
        </p>
      )}

      {draft && (
        <div className="mb-6 space-y-3 rounded-xl border bg-surface p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              placeholder="Name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
            />
            <input
              placeholder="Icon (e.g. FE)"
              value={draft.icon}
              onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
              className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
            />
            <select
              value={draft.category}
              onChange={(e) =>
                setDraft({ ...draft, category: e.target.value as TemplateCategory })
              }
              className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
            >
              <option value="expert">Expert</option>
              <option value="writing">Writing</option>
              <option value="coding">Coding</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">
              Tier (access level)
            </label>
            <select
              value={draft.tier}
              onChange={(e) =>
                setDraft({ ...draft, tier: parseInt(e.target.value, 10) })
              }
              className="w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none sm:w-64"
            >
              {TIER_LABELS.map((label, i) => (
                <option key={i} value={i}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <input
            placeholder="Short description"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className="w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
          />
          <textarea
            placeholder="System prompt"
            rows={4}
            value={draft.system_prompt}
            onChange={(e) => setDraft({ ...draft, system_prompt: e.target.value })}
            className="w-full resize-none rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Save
            </button>
            <button
              onClick={() => setDraft(null)}
              className="rounded-lg border px-4 py-2 text-sm text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-3">{t.name}</td>
                <td className="px-4 py-3 capitalize">
                  {t.category}
                  {t.tier > 0 && (
                    <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-xs text-primary">
                      {TIER_LABELS[t.tier]}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggle(t)}
                    className={`rounded px-2 py-1 text-xs ${
                      t.is_active
                        ? "bg-green-500/15 text-green-400"
                        : "bg-surface-2 text-muted"
                    }`}
                  >
                    {t.is_active ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      setDraft({
                        id: t.id,
                        name: t.name,
                        description: t.description ?? "",
                        category: t.category,
                        icon: t.icon ?? "",
                        system_prompt: t.system_prompt,
                        is_active: t.is_active,
                        tier: t.tier ?? 0,
                      })
                    }
                    className="mr-3 text-xs text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(t.id)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
