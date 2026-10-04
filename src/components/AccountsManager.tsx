"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/db";

export default function AccountsManager({
  mode,
  accounts,
  cap,
}: {
  mode: "agency" | "team";
  accounts: Pick<Profile, "id" | "email" | "words_remaining" | "created_at">[];
  cap: number;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [words, setWords] = useState("10000");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const label = mode === "agency" ? "Client" : "Team member";
  const atCap = accounts.length >= cap;

  async function create() {
    if (!email || !password || busy) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/agency/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        words: parseInt(words || "0", 10),
        mode,
      }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(data.error ?? "Failed");
    setEmail("");
    setPassword("");
    router.refresh();
  }

  async function remove(id: string, mail: string) {
    if (!confirm(`Delete ${mail}?`)) return;
    await fetch(`/api/agency/users?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {mode === "agency" ? "Agency Clients" : "Team"}
        </h1>
        <span className="text-sm text-muted">
          {accounts.length} / {cap} used
        </span>
      </div>
      <p className="mb-6 text-sm text-muted">
        Create and manage {label.toLowerCase()} accounts.
      </p>

      {msg && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {msg}
        </p>
      )}

      {!atCap ? (
        <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border bg-surface p-5 sm:grid-cols-4">
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
          <input
            type="number"
            placeholder="Words"
            value={words}
            onChange={(e) => setWords(e.target.value)}
            className="rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={create}
            disabled={busy}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {busy ? "Creating…" : `+ Add ${label}`}
          </button>
        </div>
      ) : (
        <p className="mb-6 rounded-lg border border-dashed bg-surface px-4 py-3 text-sm text-muted">
          You have reached your limit of {cap} accounts.
        </p>
      )}

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Words</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-3">{a.email}</td>
                <td className="px-4 py-3">{a.words_remaining.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => remove(a.id, a.email)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted">
                  No accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
