"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Resource, ResourceSection, ResourceType } from "@/types/db";

type Draft = {
  id?: string;
  section: ResourceSection;
  title: string;
  description: string;
  url: string;
  type: ResourceType;
  sort_order: number;
};

const empty: Draft = {
  section: "training",
  title: "",
  description: "",
  url: "",
  type: "link",
  sort_order: 0,
};

export default function ResourcesClient({
  resources,
}: {
  resources: Resource[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    if (!draft) return;
    setMsg(null);
    const res = await fetch("/api/admin/resources", {
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
    if (!confirm("Delete this resource?")) return;
    await fetch(`/api/admin/resources?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Resources</h1>
        <button
          onClick={() => setDraft({ ...empty })}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + New resource
        </button>
      </div>
      <p className="mb-4 text-sm text-muted">
        Training (OTO5), VIP (OTO10) and Reseller (OTO7) materials. Users see
        these on their gated pages.
      </p>

      {msg && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {msg}
        </p>
      )}

      {draft && (
        <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border bg-surface p-5 sm:grid-cols-2">
          <select
            value={draft.section}
            onChange={(e) =>
              setDraft({ ...draft, section: e.target.value as ResourceSection })
            }
            className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
          >
            <option value="training">Training</option>
            <option value="vip">VIP</option>
            <option value="reseller">Reseller</option>
          </select>
          <select
            value={draft.type}
            onChange={(e) =>
              setDraft({ ...draft, type: e.target.value as ResourceType })
            }
            className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
          >
            <option value="link">Link</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
          </select>
          <input
            placeholder="Title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none sm:col-span-2"
          />
          <input
            placeholder="Description"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none sm:col-span-2"
          />
          <input
            placeholder="URL (https://…)"
            value={draft.url}
            onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
          />
          <input
            type="number"
            placeholder="Sort order"
            value={draft.sort_order}
            onChange={(e) =>
              setDraft({ ...draft, sort_order: parseInt(e.target.value || "0", 10) })
            }
            className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
          />
          <div className="flex gap-2 sm:col-span-2">
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
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3 capitalize">{r.section}</td>
                <td className="px-4 py-3">{r.title}</td>
                <td className="px-4 py-3 capitalize">{r.type}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      setDraft({
                        id: r.id,
                        section: r.section,
                        title: r.title,
                        description: r.description ?? "",
                        url: r.url ?? "",
                        type: r.type,
                        sort_order: r.sort_order,
                      })
                    }
                    className="mr-3 text-xs text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {resources.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  No resources yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
