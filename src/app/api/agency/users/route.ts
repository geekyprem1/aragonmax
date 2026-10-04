import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  words: z.number().int().min(0).optional(),
  mode: z.enum(["agency", "team"]),
});

function capFor(mode: "agency" | "team", ent: ReturnType<typeof getEntitlements>) {
  return mode === "agency" ? ent.agency_accounts : Math.max(ent.seats - 1, 0);
}

export async function POST(req: Request) {
  const owner = await requireUser();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { email, password, words, mode } = parsed.data;
  const ent = getEntitlements(owner);

  if (mode === "agency" && !ent.is_agency)
    return NextResponse.json({ error: "Agency upgrade required." }, { status: 402 });
  if (mode === "team" && ent.seats <= 1)
    return NextResponse.json({ error: "Team seats upgrade required." }, { status: 402 });

  const admin = createAdminClient();

  // Enforce cap.
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", owner.id)
    .eq("member_type", mode);

  const cap = capFor(mode, ent);
  if ((count ?? 0) >= cap)
    return NextResponse.json(
      { error: `Limit reached (${cap} ${mode} accounts).` },
      { status: 400 }
    );

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

  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    email,
    role: "user",
    parent_id: owner.id,
    member_type: mode,
    words_remaining: words ?? 10000,
    status: "active",
    // Team members inherit the owner's Pro/Bulk access; agency clients do not.
    feature_pro: mode === "team" ? ent.feature_pro : false,
    feature_bulk: mode === "team" ? ent.feature_bulk : false,
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileErr.message }, { status: 400 });
  }

  return NextResponse.json({ id: created.user.id });
}

export async function DELETE(req: Request) {
  const owner = await requireUser();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  // Only allow deleting your own child accounts.
  const { data: child } = await admin
    .from("profiles")
    .select("id, parent_id")
    .eq("id", id)
    .maybeSingle();
  if (!child || child.parent_id !== owner.id)
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
