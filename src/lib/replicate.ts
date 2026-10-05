const BASE = "https://api.replicate.com/v1";

export class ReplicateError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

function token(): string {
  const t = process.env.REPLICATE_API_TOKEN;
  if (!t) throw new ReplicateError("REPLICATE_API_TOKEN not configured.", 500);
  return t;
}

export interface Prediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output: unknown;
  error?: string | null;
}

/** Extract a single media URL from a prediction output (string or array). */
export function outputUrl(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    const last = output[output.length - 1];
    return typeof last === "string" ? last : null;
  }
  return null;
}

/** Create a prediction on an official model (owner/name). */
export async function createPrediction(
  model: string,
  input: Record<string, unknown>
): Promise<Prediction> {
  const res = await fetch(`${BASE}/models/${model}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ReplicateError(
      json?.detail || `Replicate error (${res.status})`,
      res.status === 402 ? 402 : 502
    );
  }
  return json as Prediction;
}

const PREDICTION_ID_RE = /^[a-zA-Z0-9]+$/;

export async function getPrediction(id: string): Promise<Prediction> {
  // Ids must be a single path segment (no traversal, no extra slashes).
  if (!PREDICTION_ID_RE.test(id)) {
    throw new ReplicateError("Invalid prediction id.", 400);
  }
  const res = await fetch(`${BASE}/predictions/${id}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new ReplicateError(json?.detail || "Could not fetch prediction", 502);
  return json as Prediction;
}

/** Poll a prediction until it finishes (used for fast image gen). */
export async function waitForPrediction(
  id: string,
  { timeoutMs = 55000, intervalMs = 1500 } = {}
): Promise<Prediction> {
  const start = Date.now();
  let p = await getPrediction(id);
  while (
    (p.status === "starting" || p.status === "processing") &&
    Date.now() - start < timeoutMs
  ) {
    await new Promise((r) => setTimeout(r, intervalMs));
    p = await getPrediction(id);
  }
  return p;
}

export const IMAGE_MODEL = () =>
  process.env.REPLICATE_IMAGE_MODEL || "openai/gpt-image-2";
export const VIDEO_MODEL = () =>
  process.env.REPLICATE_VIDEO_MODEL || "prunaai/p-video";
