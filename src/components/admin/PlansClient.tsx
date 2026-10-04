"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@/types/db";

type Draft = {
  id?: string;
  name: string;
  monthly_words: number;
  price: number | null;
  purchase_url: string;
  is_active: boolean;
  is_unlimited: boolean;
  template_level: number;
  feature_pro: boolean;
  feature_bulk: boolean;
  feature_traffic: boolean;
  is_agency: boolean;
  agency_accounts: number;
  seats: number;
  is_whitelabel: boolean;
  is_reseller: boolean;
  is_vip: boolean;
  feature_media: boolean;
  image_credits: number;
  video_credits: number;
};

const empty: Draft = {
  name: "",
  monthly_words: 0,
  price: 0,
  purchase_url: "",
  is_active: true,
  is_unlimited: false,
  template_level: 0,
  feature_pro: false,
  feature_bulk: false,
  feature_traffic: false,
  is_agency: false,
  agency_accounts: 0,
  seats: 1,
  is_whitelabel: false,
  is_reseller: false,
  is_vip: false,
  feature_media: false,
  image_credits: 0,
  video_credits: 0,
};

const FLAGS: { key: keyof Draft; label: string }[] = [
  { key: "is_unlimited", label: "Unlimited words" },
  { key: "feature_pro", label: "Pro (PDF/Vision)" },
  { key: "feature_bulk", label: "Bulk generation" },
  { key: "feature_traffic", label: "Traffic/Training" },
  { key: "feature_media", label: "Creative Studio" },
  { key: "is_agency", label: "Agency" },
  { key: "is_whitelabel", label: "Whitelabel" },
  { key: "is_reseller", label: "Reseller" },
  { key: "is_vip", label: "VIP" },
];

export default function PlansClient({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    if (!draft) return;
    setMsg(null);
    const res = await fetch("/api/admin/plans", {
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
    if (!confirm("Delete this plan?")) return;
    await fetch(`/api/admin/plans?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Plans</h1>
        <button
          onClick={() => setDraft({ ...empty })}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + New plan
        </button>
      </div>

      {msg && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {msg}
        </p>
      )}

      {draft && (
        <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border bg-surface p-5 sm:grid-cols-2">
          <input
            placeholder="Name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
          />
          <input
            type="number"
            placeholder="Monthly words"
            value={draft.monthly_words}
            onChange={(e) =>
              setDraft({ ...draft, monthly_words: parseInt(e.target.value || "0", 10) })
            }
            className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
          />
          <input
            type="number"
            placeholder="Price"
            value={draft.price ?? 0}
            onChange={(e) =>
              setDraft({ ...draft, price: parseFloat(e.target.value || "0") })
            }
            className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
          />
          <input
            placeholder="Purchase URL (JVZoo/W+)"
            value={draft.purchase_url}
            onChange={(e) => setDraft({ ...draft, purchase_url: e.target.value })}
            className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
          />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
            />
            Active
          </label>

          {/* Entitlements */}
          <div className="sm:col-span-2 rounded-lg border border-dashed p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted">
              Entitlements (OTO features)
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FLAGS.map((f) => (
                <label
                  key={f.key}
                  className="flex items-center gap-2 text-xs text-muted"
                >
                  <input
                    type="checkbox"
                    checked={draft[f.key] as boolean}
                    onChange={(e) =>
                      setDraft({ ...draft, [f.key]: e.target.checked })
                    }
                  />
                  {f.label}
                </label>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <label className="text-xs text-muted">
                Template level (0-2)
                <input
                  type="number"
                  min={0}
                  max={2}
                  value={draft.template_level}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      template_level: parseInt(e.target.value || "0", 10),
                    })
                  }
                  className="mt-1 w-full rounded border bg-surface-2 px-2 py-1 outline-none"
                />
              </label>
              <label className="text-xs text-muted">
                Agency accounts
                <input
                  type="number"
                  min={0}
                  value={draft.agency_accounts}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      agency_accounts: parseInt(e.target.value || "0", 10),
                    })
                  }
                  className="mt-1 w-full rounded border bg-surface-2 px-2 py-1 outline-none"
                />
              </label>
              <label className="text-xs text-muted">
                Team seats
                <input
                  type="number"
                  min={1}
                  value={draft.seats}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      seats: parseInt(e.target.value || "1", 10),
                    })
                  }
                  className="mt-1 w-full rounded border bg-surface-2 px-2 py-1 outline-none"
                />
              </label>
              <label className="text-xs text-muted">
                Image credits
                <input
                  type="number"
                  min={0}
                  value={draft.image_credits}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      image_credits: parseInt(e.target.value || "0", 10),
                    })
                  }
                  className="mt-1 w-full rounded border bg-surface-2 px-2 py-1 outline-none"
                />
              </label>
              <label className="text-xs text-muted">
                Video credits
                <input
                  type="number"
                  min={0}
                  value={draft.video_credits}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      video_credits: parseInt(e.target.value || "0", 10),
                    })
                  }
                  className="mt-1 w-full rounded border bg-surface-2 px-2 py-1 outline-none"
                />
              </label>
            </div>
          </div>

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
              <th className="px-4 py-3">Words</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3">
                  {p.name}
                  {p.feature_media && (
                    <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-xs text-primary">
                      Studio
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.is_unlimited ? (
                    <span className="font-medium text-primary">∞ Unlimited</span>
                  ) : (
                    p.monthly_words.toLocaleString()
                  )}
                </td>
                <td className="px-4 py-3">{p.price ?? "—"}</td>
                <td className="px-4 py-3">{p.is_active ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      setDraft({
                        id: p.id,
                        name: p.name,
                        monthly_words: p.monthly_words,
                        price: p.price,
                        purchase_url: p.purchase_url ?? "",
                        is_active: p.is_active,
                        is_unlimited: p.is_unlimited,
                        template_level: p.template_level,
                        feature_pro: p.feature_pro,
                        feature_bulk: p.feature_bulk,
                        feature_traffic: p.feature_traffic,
                        is_agency: p.is_agency,
                        agency_accounts: p.agency_accounts,
                        seats: p.seats,
                        is_whitelabel: p.is_whitelabel,
                        is_reseller: p.is_reseller,
                        is_vip: p.is_vip,
                        feature_media: p.feature_media,
                        image_credits: p.image_credits,
                        video_credits: p.video_credits,
                      })
                    }
                    className="mr-3 text-xs text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(p.id)}
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
