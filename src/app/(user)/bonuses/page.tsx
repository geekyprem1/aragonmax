import { redirect } from "next/navigation";
import { Gift, Download, Clock, FolderOpen } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { BONUSES, BONUS_FOLDER_URL, SUPPORT_EMAIL } from "@/lib/bonuses";

export default async function BonusesPage() {
  const profile = await requireUser();
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl px-5 py-7 sm:px-8 sm:py-10">
      <p className="os-eyebrow mb-2">Your workspace / Bonuses</p>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Your ArgonMax PDF Bonuses</h1>
          <p className="mt-1.5 text-sm text-muted">
            Download and save your five bonus PDFs below. If a link does not open, contact{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            using your purchase email.
          </p>
        </div>
        <a
          href={BONUS_FOLDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <FolderOpen size={15} /> Open bonus folder
        </a>
      </div>

      <div className="grid gap-3">
        {BONUSES.map((b) => (
          <div key={b.id} className="os-tool-card items-start">
            <span className="os-tool-icon">
              <Gift size={20} strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="os-eyebrow mb-1">
                Bonus #{b.id} · Value {b.value} · {b.pages}
              </p>
              <h2 className="text-sm font-medium">{b.title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{b.desc}</p>
            </div>
            {b.url ? (
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Download ${b.title}`}
                className="inline-flex shrink-0 items-center gap-1.5 self-center rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover"
              >
                <Download size={14} /> Download
              </a>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1.5 self-center rounded-lg border px-4 py-2 text-xs text-muted">
                <Clock size={14} /> Coming soon
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
