/**
 * Teaser for a feature the user has not unlocked yet.
 * Shows the feature name locked + an upgrade CTA (drives OTO sales).
 */
export default function LockedItem({
  label,
  description,
  upgradeUrl,
}: {
  label: string;
  description?: string;
  upgradeUrl?: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-surface px-3 py-2 text-sm opacity-80">
      <div className="flex items-center gap-2">
        <span className="text-muted">🔒</span>
        <div>
          <span className="text-muted">{label}</span>
          {description && (
            <p className="text-xs text-muted/70">{description}</p>
          )}
        </div>
      </div>
      {upgradeUrl ? (
        <a
          href={upgradeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-hover"
        >
          Upgrade
        </a>
      ) : (
        <span className="shrink-0 rounded-md bg-surface-2 px-2.5 py-1 text-xs text-muted">
          Locked
        </span>
      )}
    </div>
  );
}
