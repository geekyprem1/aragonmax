import type { AiModel } from "@/types/db";

interface EnvModel {
  key: string; // internal selection id (unique)
  name: string; // what the user sees
  badge?: string;
  real?: string; // actual provider model id sent to the API
}

/**
 * Models are configured via the KIMI_MODELS env var (JSON array, one line).
 * Example:
 *   KIMI_MODELS=[{"key":"kimi-k3","name":"ArgonMax K3","badge":"Recommended","real":"deepseek/deepseek-v4-flash-0731"},{"key":"opus-4.8","name":"Opus 4.8","real":"deepseek/deepseek-v4-flash-0731"}]
 * - `key`  = unique id used as the selector value (can be a branded slug)
 * - `name` = display name shown to the user
 * - `real` = the real provider/model id actually sent to the API.
 *            If omitted, falls back to KIMI_BACKEND_MODEL, then to `key`.
 */
function parseModels(): EnvModel[] {
  const raw = process.env.KIMI_MODELS;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const parsed = arr
          .filter(
            (m) =>
              m &&
              typeof m.key === "string" &&
              typeof m.name === "string" &&
              m.key.trim()
          )
          .map((m) => ({
            key: m.key.trim(),
            name: m.name.trim(),
            badge:
              typeof m.badge === "string" && m.badge.trim()
                ? m.badge.trim()
                : undefined,
            real:
              typeof m.real === "string" && m.real.trim()
                ? m.real.trim()
                : undefined,
          }));
        if (parsed.length) return parsed;
      }
    } catch {
      // fall through to default
    }
  }
  return [
    {
      key: "kimi-k3",
      name: "ArgonMax K3",
      badge: "Recommended",
      real: process.env.KIMI_BACKEND_MODEL || "moonshotai/kimi-k2",
    },
  ];
}

/** The default backend model id (used when nothing else specifies one). */
function fallbackReal(): string {
  return process.env.KIMI_BACKEND_MODEL || "moonshotai/kimi-k2";
}

/** Default selection KEY (for the model selector). */
export async function getDefaultModel(): Promise<string> {
  const envDefault = process.env.KIMI_DEFAULT_MODEL?.trim();
  const models = parseModels();
  if (envDefault && models.some((m) => m.key === envDefault)) return envDefault;
  return models[0]?.key ?? "kimi-k3";
}

/** Active display models for the selector. */
export async function getActiveModels(): Promise<AiModel[]> {
  const def = await getDefaultModel();
  return parseModels().map((m, i) => ({
    id: m.key,
    model_key: m.key,
    display_name: m.name,
    is_default: m.key === def,
    is_active: true,
    badge: m.badge ?? null,
    sort_order: i,
  }));
}

/** Is this selection key valid? */
export async function isModelActive(modelKey: string): Promise<boolean> {
  return parseModels().some((m) => m.key === modelKey);
}

/** Resolve a selection key to the REAL provider model id sent to the API. */
export async function resolveModel(modelKey: string): Promise<string> {
  const entry = parseModels().find((m) => m.key === modelKey);
  // Documented contract: real override → KIMI_BACKEND_MODEL → key itself.
  return (
    entry?.real ||
    process.env.KIMI_BACKEND_MODEL?.trim() ||
    entry?.key ||
    fallbackReal()
  );
}

/** Real backend model for the default selection (used by Writer/Code). */
export async function getBackendModel(): Promise<string> {
  const key = await getDefaultModel();
  return resolveModel(key);
}

/** Vision-capable model id (for image inputs), or null if not configured. */
export function getVisionModel(): string | null {
  return process.env.KIMI_VISION_MODEL?.trim() || null;
}
