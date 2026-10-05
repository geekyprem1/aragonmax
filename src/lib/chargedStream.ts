import { settleWords } from "@/lib/credits";
import type { AiModule } from "@/types/db";

/**
 * Wraps an upstream text stream and settles usage exactly once — on
 * completion, on error, or when the consumer cancels (client disconnect).
 * If the request aborts mid-stream, the partial output is still charged.
 */
export function chargedStream(opts: {
  stream: ReadableStream<Uint8Array>;
  getFullText: () => string;
  userId: string;
  module: AiModule;
  model: string;
  unlimited?: boolean;
  reserved: number;
}): ReadableStream<Uint8Array> {
  const reader = opts.stream.getReader();
  let settled = false;

  async function settle() {
    if (settled) return;
    settled = true;
    await settleWords({
      userId: opts.userId,
      reserved: opts.reserved,
      outputText: opts.getFullText(),
      module: opts.module,
      model: opts.model,
      unlimited: opts.unlimited,
    });
  }

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      let result: ReadableStreamReadResult<Uint8Array>;
      try {
        result = await reader.read();
      } catch (err) {
        controller.error(err);
        await settle();
        return;
      }
      if (result.done) {
        controller.close();
        await settle();
        return;
      }
      controller.enqueue(result.value);
    },
    async cancel(reason) {
      await reader.cancel(reason).catch(() => {});
      await settle();
    },
  });
}
