import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { pickEntitlements } from "@/lib/entitlements";
import { deleteUserMediaFiles } from "@/lib/mediaCleanup";

export const runtime = "nodejs";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  plan_id: z.string().uuid().nullable().optional(),
  words: z.number().int().min(0).optional(),
  role: z.enum(["admin", "user"]).optional(),
});

const entitlementsSchema = z
  .object({
    is_unlimited: z.boolean(),
    template_level: z.number().int().min(0).max(2),
    feature_pro: z.boolean(),
    feature_bulk: z.boolean(),
    feature_traffic: z.boolean(),
    is_agency: z.boolean(),
    agency_accounts: z.number().int().min(0),
    seats: z.number().int().min(1),
    is_whitelabel: z.boolean(),
    is_reseller: z.boolean(),
    is_vip: z.boolean(),
    feature_media: z.boolean(),
    image_credits: z.number().int().min(0),
    video_credits: z.number().int().min(0),
  })
  .partial();

const patchSchema = z.object({
  id: z.string().uuid(),
  plan_id: z.string().uuid().nullable().optional(),
  apply_plan: z.boolean().optional(), // copy plan presets onto the profile
  set_words: z.number().int().min(0).optional(),
  add_words: z.number().int().optional(),
  status: z.enum(["active", "disabled"]).optional(),
  entitlements: entitlementsSchema.optional(),
});

export async function POST(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { email, password, plan_id, words, role } = parsed.data;
  const admin = createAdminClient();

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !created.user)
    return NextResponse.json(
      { error: error?.message ?? "Could not create user" },
      { status: 400 }
    );

  // Copy plan presets (words + entitlements) if a plan is chosen.
  let initialWords = words ?? 0;
  let presets = {};
  if (plan_id) {
    const { data: plan } = await admin
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .maybeSingle();
    if (plan) {
      if (words === undefined) initialWords = plan.monthly_words ?? 0;
      presets = {
        ...pickEntitlements(plan),
        image_credits: plan.image_credits ?? 0,
        video_credits: plan.video_credits ?? 0,
      };
    }
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    email,
    role: role ?? "user",
    plan_id: plan_id ?? null,
    words_remaining: initialWords,
    status: "active",
    ...presets,
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileErr.message }, { status: 400 });
  }

  return NextResponse.json({ id: created.user.id });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { id, plan_id, apply_plan, set_words, add_words, status, entitlements } =
    parsed.data;
  const admin = createAdminClient();

  const update: Record<string, unknown> = {};
  if (plan_id !== undefined) update.plan_id = plan_id;
  if (status !== undefined) update.status = status;
  if (set_words !== undefined) update.words_remaining = set_words;

  // Assigning/changing plan can copy its presets (words + entitlements).
  if (apply_plan && plan_id) {
    const { data: plan } = await admin
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .maybeSingle();
    if (plan) {
      Object.assign(update, pickEntitlements(plan));
      update.image_credits = plan.image_credits ?? 0;
      update.video_credits = plan.video_credits ?? 0;
      if (set_words === undefined) update.words_remaining = plan.monthly_words ?? 0;
    }
  }

  // Per-user fine-tune (needed to stack OTO purchases).
  if (entitlements) {
    for (const [k, v] of Object.entries(entitlements)) {
      if (v !== undefined) update[k] = v;
    }
  }

  if (add_words !== undefined) {
    const { error: addErr } = await admin.rpc("add_words", {
      p_user: id,
      p_amount: add_words,
    });
    if (addErr)
      return NextResponse.json({ error: addErr.message }, { status: 400 });
  }

  const { error } = await admin.from("profiles").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Disabling a parent also disables its child accounts.
  if (status === "disabled") {
    await admin
      .from("profiles")
      .update({ status: "disabled" })
      .eq("parent_id", id);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const adminProfile = await requireAdmin();
  if (!adminProfile)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (id === adminProfile.id)
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );

  const admin = createAdminClient();

  const { data: target } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", id)
    .maybeSingle();
  if (!target)
    return NextResponse.json({ error: "User not found" }, { status: 400 });

  if (target.role === "admin") {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) <= 1)
      return NextResponse.json(
        { error: "Cannot delete the last admin account." },
        { status: 400 }
      );
  }

  await deleteUserMediaFiles(id);
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
