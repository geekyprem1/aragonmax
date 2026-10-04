export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

interface MoonshotConfig {
  apiKey: string;
  baseUrl: string;
}

/** API key + base URL from env. OpenRouter: set MOONSHOT_BASE_URL=https://openrouter.ai/api/v1 */
function getConfig(): MoonshotConfig {
  const apiKey = process.env.MOONSHOT_API_KEY || "";
  const baseUrl = process.env.MOONSHOT_BASE_URL || "https://api.moonshot.ai/v1";
  return { apiKey, baseUrl };
}

export class KimiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

/** Request headers. Includes OpenRouter-recommended headers (ignored by Moonshot). */
function buildHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "ArgonMax AI";
  if (appUrl) headers["HTTP-Referer"] = appUrl;
  headers["X-Title"] = appName;
  return headers;
}

/**
 * Streaming chat completion. Returns a ReadableStream of text chunks
 * plus a promise resolving to the full text once complete.
 */
export async function streamChat(params: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  reasoning?: "on" | "off";
  maxTokens?: number;
}): Promise<{ stream: ReadableStream<Uint8Array>; getFullText: () => string }> {
  const { apiKey, baseUrl } = getConfig();
  if (!apiKey) {
    throw new KimiError(
      "API key not configured. Set MOONSHOT_API_KEY in your environment.",
      500
    );
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.6,
      stream: true,
      provider: { sort: "throughput" },
      ...(params.reasoning === "on" ? {} : { reasoning: { enabled: false } }),
      ...(params.maxTokens ? { max_tokens: params.maxTokens } : {}),
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    if (res.status === 401)
      throw new KimiError("Invalid API key.", 401);
    if (res.status === 429)
      throw new KimiError("Rate limit reached. Try again shortly.", 429);
    throw new KimiError(
      `AI service error (${res.status}): ${text.slice(0, 200)}`,
      502
    );
  }

  let fullText = "";
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const source = res.body;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = source.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta: string = json.choices?.[0]?.delta?.content ?? "";
              if (delta) {
                fullText += delta;
                controller.enqueue(encoder.encode(delta));
              }
            } catch {
              // ignore malformed partial JSON
            }
          }
        }
      } catch (err) {
        controller.error(err);
        return;
      } finally {
        reader.releaseLock();
      }
      controller.close();
    },
  });

  return { stream, getFullText: () => fullText };
}

/** Non-streaming completion — returns full text. */
export async function completeChat(params: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  reasoning?: "on" | "off";
}): Promise<string> {
  const { apiKey, baseUrl } = getConfig();
  if (!apiKey) {
    throw new KimiError(
      "API key not configured. Set MOONSHOT_API_KEY in your environment.",
      500
    );
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.6,
      stream: false,
      provider: { sort: "throughput" },
      ...(params.reasoning === "on" ? {} : { reasoning: { enabled: false } }),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401)
      throw new KimiError("Invalid API key.", 401);
    if (res.status === 429)
      throw new KimiError("Rate limit reached. Try again shortly.", 429);
    throw new KimiError(
      `AI service error (${res.status}): ${text.slice(0, 200)}`,
      502
    );
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}
