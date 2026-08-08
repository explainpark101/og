import { Hono } from "hono";
import type { Env } from "../types/env";
import { validateUrl } from "../lib/url";
import { fetchHtml } from "../lib/fetch";
import { inspectSocialPreview } from "../lib/preview";
import { jsonError, jsonSuccess } from "../utils/response";

const app = new Hono<{ Bindings: Env }>();

app.get("/inspect", async (c) => {
  const url = validateUrl(c.req.query("url"));
  if (!url) {
    return jsonError(c, "Missing or invalid query parameter: url", "INVALID_URL");
  }

  try {
    const html = await fetchHtml(url);
    const result = await inspectSocialPreview(url, html);
    return jsonSuccess(c, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch URL";
    return jsonError(c, message, "FETCH_ERROR", 502);
  }
});

export default app;
