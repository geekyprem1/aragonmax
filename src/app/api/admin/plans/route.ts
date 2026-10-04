import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  monthly_words: z.number().int().min(0),
  price: z.number().min(0).nullable().optional(),
  purchase_url: z.string().url().nullable().optional().or(z.literal("")),
  is_active: z.boolean().optional(),
  // entitlement presets
  is_unlimited: z.boolean().optional(),
  template_level: z.number().int().min(0).max(2).optional(),
  feature_pro: z.boolean().optional(),
  feature_bulk: z.boolean().optional(),
  feature_traffic: z.boolean().optional(),
  is_agency: z.boolean().optional(),
  agency_accounts: z.number().int().min(0).optional(),
  seats: z.number().int().min(1).optional(),
  is_whitelabel: z.boolean().optional(),
  is_reseller: z.boolean().optional(),
  is_vip: z.boolean().optional(),
  feature_media: z.boolean().optional(),
  image_credits: z.number().int().min(0).optional(),
  video_credits: z.number().int().min(0).optional(),
});

export async function POST(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = upsertSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const admin = createAdminClient();
  const { id, ...fields } = parsed.data;
  const payload = { ...fields, purchase_url: fields.purchase_url || null };

  const query = id
    ? admin.from("plans").update(payload).eq("id", id)
    : admin.from("plans").insert(payload);

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("plans").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
