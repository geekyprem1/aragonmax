import type { Profile } from "@/types/db";

export default function CreditBar({ profile }: { profile: Profile }) {
  const total = profile.plan?.monthly_words ?? 0;
  const remaining = profile.words_remaining;
  const used = Math.max(total - remaining, 0);
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;

  if (profile.is_unlimited) {
    return (
      <div className="rounded-xl border bg-surface p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Words</span>
          <span className="flex items-center gap-1.5 font-medium text-primary">
            <span>∞</span> Unlimited
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-primary to-primary/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-muted">Words remaining</span>
        <span className="font-medium">
          {remaining.toLocaleString()}
          {total > 0 && (
            <span className="text-muted"> / {total.toLocaleString()}</span>
          )}
        </span>
      </div>
      {total > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${100 - pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
