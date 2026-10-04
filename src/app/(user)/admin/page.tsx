import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminOverview() {
  const admin = createAdminClient();
  const [{ count: userCount }, { data: usage }] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("usage_logs").select("words_used"),
  ]);

  const totalWords = (usage ?? []).reduce((s, r) => s + Number(r.words_used), 0);

  const stats = [
    { label: "Total users", value: userCount ?? 0 },
    { label: "Words used (all time)", value: totalWords.toLocaleString() },
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
