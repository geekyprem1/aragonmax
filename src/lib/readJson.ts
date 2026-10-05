/**
 * Reads and parses a JSON request body with a hard size cap, so oversized
 * payloads are rejected before any expensive work starts.
 */
export async function readJsonBody(
  req: Request,
  maxChars = 1_000_000
): Promise<unknown> {
  const raw = await req.text().catch(() => "");
  if (!raw || raw.length > maxChars) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
