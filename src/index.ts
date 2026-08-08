import { Hono } from "hono";
import type { Env } from "./types/env";
import inspectRoutes from "./routes/inspect";

const app = new Hono<{ Bindings: Env }>();

app.route("/", inspectRoutes);

app.get("/", (c) => {
  return c.json({
    name: "social-preview-inspector",
    description:
      "Extract Open Graph and Twitter meta tags and validate social preview cards side by side",
    usage: "GET /inspect?url=https://example.com",
  });
});

app.onError((err, c) => {
  return c.json({ error: err.message, code: "INTERNAL_ERROR" }, 500);
});

export default {
  fetch: app.fetch,
};
