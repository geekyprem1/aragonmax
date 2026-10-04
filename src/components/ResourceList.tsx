import type { Resource } from "@/types/db";

const ICON: Record<Resource["type"], string> = {
  video: "▶",
  pdf: "📄",
  link: "🔗",
};

export default function ResourceList({
  title,
  items,
}: {
  title: string;
  items: Resource[];
}) {
  return (
    <div>
      <h2 className="mb-3 font-medium">{title}</h2>
      {items.length === 0 ? (
        <p className="rounded-xl border bg-surface p-6 text-center text-sm text-muted">
          No items yet. Check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between gap-3 rounded-xl border bg-surface p-4"
            >
              <div className="flex gap-3">
                <span className="text-lg">{ICON[r.type]}</span>
                <div>
                  <h3 className="text-sm font-medium">{r.title}</h3>
                  {r.description && (
                    <p className="mt-0.5 text-xs text-muted">{r.description}</p>
                  )}
                </div>
              </div>
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-hover"
                >
                  Open
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
