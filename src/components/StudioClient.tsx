"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImageIcon,
  Video,
  Sparkles,
  Download,
  Wand2,
  Loader2,
} from "lucide-react";

type Tab = "image" | "video";

// Ratios supported by openai/gpt-image-2.
const IMAGE_RATIOS = ["1:1", "3:2", "2:3"];
const VIDEO_RATIOS = ["16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "1:1"];

interface GenItem {
  id: string;
  type: Tab;
}

interface PendingJob {
  id: string;
  type: Tab;
  prompt: string | null;
  ratio: string | null;
}

interface JobParams {
  type: Tab;
  prompt: string;
  ratio: string;
}

export default function StudioClient({
  imageCredits,
  videoCredits,
  initialGenerations,
  pendingJobs = [],
}: {
  imageCredits: number;
  videoCredits: number;
  initialGenerations: GenItem[];
  pendingJobs?: PendingJob[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("image");
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const [imgLeft, setImgLeft] = useState(imageCredits);
  const [vidLeft, setVidLeft] = useState(videoCredits);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<Tab>("image");
  const [gallery, setGallery] = useState<GenItem[]>(initialGenerations);
  const [error, setError] = useState<string | null>(null);

  function switchTab(t: Tab) {
    setTab(t);
    setResult(null);
    setError(null);
    setRatio(t === "image" ? "1:1" : "16:9");
  }

  async function pollAndSave(predId: string, job: JobParams): Promise<void> {
    for (let i = 0; i < 150; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      const res = await fetch(`/api/media/status?id=${predId}`);
      const data = await res.json();
      if (data.done) {
        const saveRes = await fetch("/api/media/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            predictionId: predId,
            type: job.type,
            prompt: job.prompt,
            aspectRatio: job.ratio,
          }),
        });
        const saved = await saveRes.json();
        if (saveRes.ok && saved.genId) {
          setResult(`/api/media/file?gen=${saved.genId}`);
          setResultType(job.type);
          setGallery((g) => [{ id: saved.genId, type: job.type }, ...g]);
        } else {
          setError(saved.error || "Could not save the result. Please try again.");
        }
        return;
      }
      if (data.status === "failed" || data.status === "canceled") {
        setError(data.error || "Generation failed. The credit was refunded.");
        return;
      }
      setStatus(data.status || "processing");
    }
    setError("Timed out — refresh later; it will resume automatically.");
  }

  // Resume jobs that were still running when the page was last unloaded.
  useEffect(() => {
    if (!pendingJobs.length) return;
    let cancelled = false;
    (async () => {
      for (const job of pendingJobs) {
        if (cancelled) return;
        try {
          await pollAndSave(job.id, {
            type: job.type,
            prompt: job.prompt ?? "",
            ratio: job.ratio ?? (job.type === "image" ? "1:1" : "16:9"),
          });
        } catch {
          // Network hiccup — keep going with the remaining jobs.
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    if (!prompt.trim() || loading) return;
    const left = tab === "image" ? imgLeft : vidLeft;
    if (left <= 0) {
      setError(`You are out of ${tab} credits.`);
      return;
    }
    setError(null);
    setResult(null);
    setStatus("starting");
    setLoading(true);
    try {
      const res = await fetch("/api/media/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tab, prompt, aspectRatio: ratio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }
      if (typeof data.remaining === "number") {
        if (tab === "image") setImgLeft(data.remaining);
        else setVidLeft(data.remaining);
      }
      await pollAndSave(data.id, { type: tab, prompt, ratio });
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      setStatus("");
      router.refresh();
    }
  }

  const ratios = tab === "image" ? IMAGE_RATIOS : VIDEO_RATIOS;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ backgroundImage: "linear-gradient(135deg,#8b5cf6,#d946ef)" }}
            >
              <Wand2 size={18} />
            </span>
            <span className="text-gradient">Creative Studio</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Generate stunning AI images and videos from a single prompt.
          </p>
        </div>
        <div className="flex gap-3">
          <CreditPill
            icon={<ImageIcon size={15} />}
            label="Images"
            value={imgLeft}
            grad="linear-gradient(135deg,#0ea5e9,#22d3ee)"
          />
          <CreditPill
            icon={<Video size={15} />}
            label="Videos"
            value={vidLeft}
            grad="linear-gradient(135deg,#8b5cf6,#d946ef)"
          />
        </div>
      </div>

      {/* Tab switcher */}
      <div className="mb-6 inline-flex rounded-xl border bg-surface/70 p-1 backdrop-blur">
        {(["image", "video"] as Tab[]).map((t) => {
          const active = tab === t;
          const Icon = t === "image" ? ImageIcon : Video;
          return (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
                active
                  ? "text-white shadow-md"
                  : "text-muted hover:text-foreground"
              }`}
              style={
                active
                  ? {
                      backgroundImage:
                        t === "image"
                          ? "linear-gradient(135deg,#0ea5e9,#22d3ee)"
                          : "linear-gradient(135deg,#8b5cf6,#d946ef)",
                    }
                  : undefined
              }
            >
              <Icon size={15} />
              {t} Generator
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Composer */}
        <div className="rounded-2xl border bg-surface/80 p-6 shadow-sm backdrop-blur">
          <label className="mb-1.5 block text-sm font-medium">
            Describe your {tab}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder={
              tab === "image"
                ? "A futuristic city at sunset, cinematic, ultra-detailed, 8k"
                : "A cinematic drone shot flying over a tropical beach at golden hour"
            }
            className="w-full resize-none rounded-xl border bg-surface-2 px-3.5 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <label className="mb-2 mt-5 block text-sm font-medium">Aspect ratio</label>
          <div className="flex flex-wrap gap-2">
            {ratios.map((r) => (
              <button
                key={r}
                onClick={() => setRatio(r)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  ratio === r
                    ? "border-primary bg-primary/15 text-primary"
                    : "text-muted hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {tab === "video" && (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-muted">
              🎬 10-sec clip · 720p · uses 1 video credit
            </p>
          )}

          <button
            onClick={generate}
            disabled={loading || !prompt.trim()}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-95 hover:shadow-primary/25 disabled:opacity-50"
            style={{ backgroundImage: "linear-gradient(135deg,#2f6bff,#22d3ee)" }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate {tab}
              </>
            )}
          </button>

          {error && (
            <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Preview */}
        <div className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-2xl border bg-surface/80 p-5 shadow-sm backdrop-blur">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-3xl"
            style={{ backgroundImage: "linear-gradient(135deg,#8b5cf6,#22d3ee)" }}
          />
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-center text-sm text-muted">
              <span className="thinking-spark text-3xl">✦</span>
              <span>
                {tab === "video"
                  ? "Rendering your video… this can take a minute"
                  : "Painting your image…"}
              </span>
              {status && (
                <span className="rounded-full bg-surface-2 px-3 py-1 text-xs capitalize">
                  {status}
                </span>
              )}
            </div>
          ) : result ? (
            <div className="w-full">
              <div className="overflow-hidden rounded-xl border">
                {resultType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result} alt="result" className="w-full" />
                ) : (
                  <video src={result} controls className="w-full" />
                )}
              </div>
              <a
                href={`${result}&dl=1`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-surface-2"
              >
                <Download size={14} /> Download
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-white/90 shadow-lg"
                style={{ backgroundImage: "linear-gradient(135deg,#2f6bff,#8b5cf6)" }}
              >
                {tab === "image" ? <ImageIcon size={22} /> : <Video size={22} />}
              </span>
              <p className="text-sm font-medium">Your {tab} will appear here</p>
              <p className="max-w-xs text-xs text-muted">
                Describe what you want and hit Generate — your creation shows up
                right here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* My Creations gallery */}
      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/80">
            My Creations
          </h2>
          {gallery.length > 0 && (
            <span className="text-xs text-muted">{gallery.length} saved</span>
          )}
        </div>
        {gallery.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-surface/60 p-10 text-center">
            <Sparkles size={22} className="mx-auto mb-2 text-muted/60" />
            <p className="text-sm text-muted">
              Your saved images and videos will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((g) => (
              <div
                key={g.id}
                className="group relative overflow-hidden rounded-xl border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="absolute left-2 top-2 z-10 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur">
                  {g.type}
                </span>
                {g.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/media/file?gen=${g.id}`}
                    alt="creation"
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <video
                    src={`/api/media/file?gen=${g.id}`}
                    controls
                    className="aspect-square w-full object-cover"
                  />
                )}
                <a
                  href={`/api/media/file?gen=${g.id}&dl=1`}
                  className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent py-3 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Download size={13} /> Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreditPill({
  icon,
  label,
  value,
  grad,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  grad: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border bg-surface/80 px-3.5 py-2 backdrop-blur">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow"
        style={{ backgroundImage: grad }}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold">{value.toLocaleString()}</div>
        <div className="text-[11px] text-muted">{label}</div>
      </div>
    </div>
  );
}
