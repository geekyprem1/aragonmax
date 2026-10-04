import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const schema = z.object({
  app_name: z.string().max(60).nullable().optional(),
  logo_url: z.string().url().nullable().optional().or(z.literal("")),
  primary_color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a hex color like #7c5cff")
    .nullable()
    .optional()
    .or(z.literal("")),
  custom_domain: z.string().nullable().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const profile = await requireUser();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!getEntitlements(profile).is_whitelabel)
    return NextResponse.json({ error: "Whitelabel is a paid upgrade." }, { status: 402 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );

  const admin = createAdminClient();
  const { error } = await admin.from("branding").upsert({
    owner_id: profile.id,
    app_name: parsed.data.app_name || null,
    logo_url: parsed.data.logo_url || null,
    primary_color: parsed.data.primary_color || null,
    custom_domain: parsed.data.custom_domain || null,
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
