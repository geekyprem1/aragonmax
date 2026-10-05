import { requireAdminPage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminOverview() {
  await requireAdminPage();
  const admin = createAdminClient();
  const [{ count: userCount }, { data: totalWords }] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.rpc("total_words_used"),
  ]);

  const stats = [
    { label: "Total users", value: userCount ?? 0 },
    { label: "Words used (all time)", value: Number(totalWords ?? 0).toLocaleString() },
  ];

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <h1 className="mb-6 text-xl font-semibold">Admin Overview</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-surface p-6">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
