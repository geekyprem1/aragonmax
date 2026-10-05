import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";
import { readJsonBody } from "@/lib/readJson";
import { deleteUserMediaFiles } from "@/lib/mediaCleanup";

export const runtime = "nodejs";

const createSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(6).max(200),
  words: z.number().int().min(0).optional(),
  mode: z.enum(["agency", "team"]),
});

function capFor(mode: "agency" | "team", ent: ReturnType<typeof getEntitlements>) {
  return mode === "agency" ? ent.agency_accounts : Math.max(ent.seats - 1, 0);
}

interface ChildResult {
  ok: boolean;
  error?: "limit" | "words" | "parent";
  available?: number;
  allocated?: number;
}

export async function POST(req: Request) {
  const owner = await requireUser();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (owner.status !== "active")
    return NextResponse.json(
      { error: "Your account is disabled. Contact the administrator." },
      { status: 403 }
    );

  const parsed = createSchema.safeParse(await readJsonBody(req));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { email, password, words, mode } = parsed.data;
  const ent = getEntitlements(owner);

  if (mode === "agency" && !ent.is_agency)
    return NextResponse.json({ error: "Agency upgrade required." }, { status: 402 });
  if (mode === "team" && ent.seats <= 1)
    return NextResponse.json({ error: "Team seats upgrade required." }, { status: 402 });

  const admin = createAdminClient();
  const cap = capFor(mode, ent);

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

  // Cap + word-pool transfer happen atomically in the DB under a parent lock.
  const { data: result, error: rpcErr } = await admin.rpc("create_agency_child", {
    p_parent: owner.id,
    p_child: created.user.id,
    p_email: email,
    p_mode: mode,
    p_cap: cap,
    p_words: words ?? null,
    p_feature_pro: mode === "team" ? ent.feature_pro : false,
    p_feature_bulk: mode === "team" ? ent.feature_bulk : false,
  });

  const child = result as ChildResult | null;
  if (rpcErr || !child?.ok) {
    await admin.auth.admin.deleteUser(created.user.id);
    if (child?.error === "limit")
      return NextResponse.json(
        { error: `Limit reached (${cap} ${mode} accounts).` },
        { status: 400 }
      );
    if (child?.error === "words")
      return NextResponse.json(
        {
          error: `Not enough words in your pool. You have ${Number(
            child.available ?? 0
          ).toLocaleString()} words available.`,
        },
        { status: 400 }
      );
    return NextResponse.json(
      { error: rpcErr?.message ?? "Could not create account" },
      { status: 400 }
    );
  }

  return NextResponse.json({ id: created.user.id, words: child.allocated ?? 0 });
}

export async function DELETE(req: Request) {
  const owner = await requireUser();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (owner.status !== "active")
    return NextResponse.json(
      { error: "Your account is disabled. Contact the administrator." },
      { status: 403 }
    );

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

  await deleteUserMediaFiles(id);
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
