"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AiModel } from "@/types/db";

export default function SettingsClient({
  identityPrompt,
  upgradeUrl,
  dailyCap,
  models,
  defaultModel,
  baseUrl,
  apiKeySet,
}: {
  identityPrompt: string;
  upgradeUrl: string;
  dailyCap: string;
  models: AiModel[];
  defaultModel: string;
  baseUrl: string;
  apiKeySet: boolean;
}) {
  const router = useRouter();
  const [identity, setIdentity] = useState(identityPrompt);
  const [upgrade, setUpgrade] = useState(upgradeUrl);
  const [cap, setCap] = useState(dailyCap);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          brand_identity_prompt: identity,
          upgrade_url: upgrade,
          daily_word_cap: cap.trim(),
        },
      }),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(data.error ?? "Failed");
    setMsg("Saved.");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <h1 className="mb-6 text-xl font-semibold">Settings</h1>

      {/* Brand identity — editable */}
      <div className="rounded-xl border bg-surface p-6">
        <h2 className="mb-1 font-medium">Brand identity prompt</h2>
        <p className="mb-3 text-xs text-muted">
          Injected as the first system message on every AI request so the model
          identifies as your brand. Leave blank to use the default.
        </p>
        <textarea
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          rows={5}
          placeholder="You are ArgonMax AI, powered by ArgonMax K3. If asked which model you are, always say ArgonMax K3…"
          className="w-full resize-none rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
        />

        <div className="mt-4">
          <h2 className="mb-1 font-medium">Upgrade URL</h2>
          <p className="mb-2 text-xs text-muted">
            Where all &quot;Upgrade / Unlock&quot; buttons point (your OTO/sales
            page). Leave blank to use the plan&apos;s purchase URL.
          </p>
          <input
            value={upgrade}
            onChange={(e) => setUpgrade(e.target.value)}
            placeholder="https://your-sales-page.com/upgrades"
            className="w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="mt-4">
          <h2 className="mb-1 font-medium">Daily word cap</h2>
          <p className="mb-2 text-xs text-muted">
            Fair-use cap for unlimited plans (words per day, UTC). 0 = no cap.
            Default: 200000.
          </p>
          <input
            value={cap}
            onChange={(e) => setCap(e.target.value)}
            placeholder="200000"
            inputMode="numeric"
            className="w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-4 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {msg && <span className="ml-3 text-sm text-muted">{msg}</span>}
      </div>

      {/* Provider config — read-only (managed via environment variables) */}
      <div className="mt-6 rounded-xl border bg-surface p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Provider &amp; models</h2>
          <span className="rounded bg-surface-2 px-2 py-1 text-xs text-muted">
            configured via .env
          </span>
        </div>

        <dl className="mb-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">API key</dt>
            <dd className={apiKeySet ? "text-green-400" : "text-red-400"}>
              {apiKeySet ? "set" : "not set"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Base URL</dt>
            <dd className="font-mono text-xs">{baseUrl}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Default model</dt>
            <dd className="font-mono text-xs">{defaultModel}</dd>
          </div>
        </dl>

        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-muted">
              <tr>
                <th className="px-3 py-2">Display name</th>
                <th className="px-3 py-2">Model key</th>
                <th className="px-3 py-2">Badge</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.model_key} className="border-t">
                  <td className="px-3 py-2">
                    {m.display_name}
                    {m.is_default && (
                      <span className="ml-2 text-xs text-primary">default</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{m.model_key}</td>
                  <td className="px-3 py-2 text-xs text-muted">{m.badge ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-muted">
          To change these, edit <code>MOONSHOT_API_KEY</code>,{" "}
          <code>MOONSHOT_BASE_URL</code>, <code>KIMI_MODELS</code> and{" "}
          <code>KIMI_DEFAULT_MODEL</code> in your environment, then redeploy.
        </p>
      </div>
    </div>
  );
}
