import { FETCH_TIMEOUT_MS } from "../constants/defaults";

export async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "social-preview-inspector/1.0",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) {
      throw new Error(`Upstream returned HTTP ${res.status}`);
    }
    return await res.text();
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err instanceof Error ? err : new Error("Failed to fetch URL");
  }
}
