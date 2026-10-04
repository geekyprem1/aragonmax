import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  section: z.enum(["training", "vip", "reseller"]),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  url: z.string().url().nullable().optional().or(z.literal("")),
  type: z.enum(["video", "pdf", "link"]),
  sort_order: z.number().int().optional(),
});

export async function POST(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = upsertSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const admin = createAdminClient();
  const { id, ...fields } = parsed.data;
  const payload = { ...fields, url: fields.url || null };

  const query = id
    ? admin.from("resources").update(payload).eq("id", id)
    : admin.from("resources").insert(payload);

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
  const { error } = await admin.from("resources").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
