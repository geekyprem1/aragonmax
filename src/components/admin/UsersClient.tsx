"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan, Profile } from "@/types/db";

export default function UsersClient({
  users,
  plans,
}: {
  users: Profile[];
  plans: Plan[];
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function api(method: string, body?: unknown, qs?: string) {
    setMsg(null);
    const res = await fetch(`/api/admin/users${qs ?? ""}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error ?? "Failed");
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          {showCreate ? "Close" : "+ New user"}
        </button>
      </div>

      {msg && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {msg}
        </p>
      )}

      {showCreate && (
        <CreateUser
          plans={plans}
          onCreate={async (body) => {
            const ok = await api("POST", body);
            if (ok) setShowCreate(false);
          }}
        />
      )}

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Words</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.id} user={u} plans={plans} api={api} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateUser({
  plans,
  onCreate,
}: {
  plans: Plan[];
  onCreate: (body: unknown) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [role, setRole] = useState<"user" | "admin">("user");

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-5">
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
      />
      <input
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
      />
      <select
        value={planId}
        onChange={(e) => setPlanId(e.target.value)}
        className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
      >
        {plans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.monthly_words.toLocaleString()})
          </option>
        ))}
      </select>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as "user" | "admin")}
        className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <button
        onClick={() =>
          onCreate({ email, password, plan_id: planId || null, role })
        }
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Create
      </button>
    </div>
  );
}

/** Editable entitlement snapshot for the Features panel. */
function entFromUser(user: Profile) {
  return {
    is_unlimited: user.is_unlimited,
    template_level: user.template_level,
    feature_pro: user.feature_pro,
    feature_bulk: user.feature_bulk,
    feature_traffic: user.feature_traffic,
    feature_media: user.feature_media,
    is_agency: user.is_agency,
    agency_accounts: user.agency_accounts,
    seats: user.seats,
    is_whitelabel: user.is_whitelabel,
    is_reseller: user.is_reseller,
    is_vip: user.is_vip,
    image_credits: user.image_credits,
    video_credits: user.video_credits,
  };
}

function UserRow({
  user,
  plans,
  api,
}: {
  user: Profile;
  plans: Plan[];
  api: (method: string, body?: unknown, qs?: string) => Promise<boolean>;
}) {
  const [addWords, setAddWords] = useState("");
  const [showEnt, setShowEnt] = useState(false);
  const [ent, setEnt] = useState(() => entFromUser(user));
  const [prevUser, setPrevUser] = useState(user);

  // Re-sync with fresh props after router.refresh() so a stale snapshot can
  // never be written back (reverting plan presets or restoring spent credits).
  if (user !== prevUser) {
    setPrevUser(user);
    setEnt(entFromUser(user));
  }

  const entFlags: { key: keyof typeof ent; label: string }[] = [
    { key: "is_unlimited", label: "Unlimited" },
    { key: "feature_pro", label: "Pro" },
    { key: "feature_bulk", label: "Bulk" },
    { key: "feature_traffic", label: "Traffic" },
    { key: "feature_media", label: "Creative Studio" },
    { key: "is_agency", label: "Agency" },
    { key: "is_whitelabel", label: "Whitelabel" },
    { key: "is_reseller", label: "Reseller" },
    { key: "is_vip", label: "VIP" },
  ];

  return (
    <>
    <tr className="border-t">
      <td className="px-4 py-3">
        {user.email}
        {user.role === "admin" && (
          <span className="ml-2 rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
            admin
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <select
          value={user.plan_id ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            if (value === (user.plan_id ?? "")) return;
            if (
              !confirm(
                "Applying a plan overwrites this user's entitlements (stacked OTOs will be removed) and resets words to the plan amount. Continue?"
              )
            )
              return;
            api("PATCH", {
              id: user.id,
              plan_id: value || null,
              apply_plan: !!value,
            });
          }}
          className="rounded border bg-surface-2 px-2 py-1 text-xs outline-none"
        >
          <option value="">—</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span>{user.words_remaining.toLocaleString()}</span>
          <input
            value={addWords}
            onChange={(e) => setAddWords(e.target.value)}
            placeholder="+words"
            className="w-20 rounded border bg-surface-2 px-2 py-1 text-xs outline-none"
          />
          <button
            onClick={async () => {
              const n = parseInt(addWords, 10);
              if (!Number.isNaN(n)) {
                await api("PATCH", { id: user.id, add_words: n });
                setAddWords("");
              }
            }}
            className="rounded bg-surface-2 px-2 py-1 text-xs hover:bg-primary hover:text-foreground"
          >
            Add
          </button>
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() =>
            api("PATCH", {
              id: user.id,
              status: user.status === "active" ? "disabled" : "active",
            })
          }
          className={`rounded px-2 py-1 text-xs ${
            user.status === "active"
              ? "bg-green-500/15 text-green-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {user.status}
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => setShowEnt((s) => !s)}
          className="mr-3 text-xs text-primary hover:underline"
        >
          Features
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete ${user.email}?`))
              api("DELETE", undefined, `?id=${user.id}`);
          }}
          className="text-xs text-red-400 hover:underline"
        >
          Delete
        </button>
      </td>
    </tr>

    {showEnt && (
      <tr className="border-t bg-surface/50">
        <td colSpan={5} className="px-4 py-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">
            Entitlements (stack OTOs here)
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {entFlags.map((f) => (
              <label
                key={f.key}
                className="flex items-center gap-2 text-xs text-muted"
              >
                <input
                  type="checkbox"
                  checked={ent[f.key] as boolean}
                  onChange={(e) =>
                    setEnt({ ...ent, [f.key]: e.target.checked })
                  }
                />
                {f.label}
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-xs text-muted">
              Template level
              <input
                type="number"
                min={0}
                max={2}
                value={ent.template_level}
                onChange={(e) =>
                  setEnt({ ...ent, template_level: parseInt(e.target.value || "0", 10) })
                }
                className="mt-1 block w-24 rounded border bg-surface-2 px-2 py-1 outline-none"
              />
            </label>
            <label className="text-xs text-muted">
              Agency accounts
              <input
                type="number"
                min={0}
                value={ent.agency_accounts}
                onChange={(e) =>
                  setEnt({ ...ent, agency_accounts: parseInt(e.target.value || "0", 10) })
                }
                className="mt-1 block w-24 rounded border bg-surface-2 px-2 py-1 outline-none"
              />
            </label>
            <label className="text-xs text-muted">
              Team seats
              <input
                type="number"
                min={1}
                value={ent.seats}
                onChange={(e) =>
                  setEnt({ ...ent, seats: parseInt(e.target.value || "1", 10) })
                }
                className="mt-1 block w-24 rounded border bg-surface-2 px-2 py-1 outline-none"
              />
            </label>
            <label className="text-xs text-muted">
              Image credits
              <input
                type="number"
                min={0}
                value={ent.image_credits}
                onChange={(e) =>
                  setEnt({ ...ent, image_credits: parseInt(e.target.value || "0", 10) })
                }
                className="mt-1 block w-24 rounded border bg-surface-2 px-2 py-1 outline-none"
              />
            </label>
            <label className="text-xs text-muted">
              Video credits
              <input
                type="number"
                min={0}
                value={ent.video_credits}
                onChange={(e) =>
                  setEnt({ ...ent, video_credits: parseInt(e.target.value || "0", 10) })
                }
                className="mt-1 block w-24 rounded border bg-surface-2 px-2 py-1 outline-none"
              />
            </label>
            <button
              onClick={async () => {
                // Only send fields that actually changed vs. fresh props.
                const changed: Record<string, boolean | number> = {};
                for (const key of Object.keys(ent) as (keyof typeof ent)[]) {
                  if (ent[key] !== user[key]) changed[key] = ent[key];
                }
                if (Object.keys(changed).length === 0) {
                  setShowEnt(false);
                  return;
                }
                const ok = await api("PATCH", { id: user.id, entitlements: changed });
                if (ok) setShowEnt(false);
              }}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover"
            >
              Save features
            </button>
          </div>
        </td>
      </tr>
    )}
    </>
  );
}
