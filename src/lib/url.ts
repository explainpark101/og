import { ALLOWED_SCHEMES } from "../constants/defaults";

/**
 * Validates and normalizes a URL for safe fetching.
 * Returns the URL string or null if invalid/not allowed.
 */
export function validateUrl(input: string | undefined): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!ALLOWED_SCHEMES.includes(url.protocol as (typeof ALLOWED_SCHEMES)[number])) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}
