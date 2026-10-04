"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Branding } from "@/types/db";

export default function BrandingClient({
  branding,
}: {
  branding: Branding | null;
}) {
  const router = useRouter();
  const [appName, setAppName] = useState(branding?.app_name ?? "");
  const [logoUrl, setLogoUrl] = useState(branding?.logo_url ?? "");
  const [color, setColor] = useState(branding?.primary_color ?? "#2563eb");
  const [domain, setDomain] = useState(branding?.custom_domain ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/branding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_name: appName,
        logo_url: logoUrl,
        primary_color: color,
        custom_domain: domain,
      }),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(data.error ?? "Failed");
    setMsg("Saved. Refresh to see your branding.");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      <h1 className="mb-1 text-xl font-semibold">Whitelabel Branding</h1>
      <p className="mb-6 text-sm text-muted">
        Customize how the app looks for you (and your client accounts).
      </p>

      <div className="space-y-4 rounded-xl border bg-surface p-6">
        <div>
          <label className="mb-1 block text-sm text-muted">App name</label>
          <input
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="Your Brand"
            className="w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Logo URL</label>
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://…/logo.png"
            className="w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Primary color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 rounded border bg-surface-2"
            />
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-32 rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">
            Custom domain (optional)
          </label>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="app.yourbrand.com"
            className="w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-xs text-muted">
            Point this domain to your deployment (see the whitelabel guide), then
            add it in your Vercel project domains.
          </p>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save branding"}
        </button>
        {msg && <span className="ml-3 text-sm text-muted">{msg}</span>}
      </div>
    </div>
  );
}
