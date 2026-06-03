/**
 * Deterministic weather alert ID generator.
 *
 * Produces a stable, collision-resistant hex string from
 * source + title + valid_from so the same alert can never
 * be double-inserted, regardless of how many times the
 * Edge Function runs.
 *
 * Uses the Web Crypto API (available in Deno / Edge runtimes).
 */
export async function buildWeatherAlertId(
  source: string,
  title: string,
  validFrom: string,
): Promise<string> {
  const raw = `${source}::${title}::${validFrom}`;
  const encoded = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Use first 16 bytes (32 hex chars) — sufficient for uniqueness
  return hashArray
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
