import { describe, it, expect, vi } from "vitest";
import worker from "../../src/index";

vi.mock("../../src/lib/fetch", () => ({
  fetchHtml: vi.fn().mockResolvedValue("<html><head><title>Example</title></head></html>"),
}));

vi.mock("../../src/lib/preview", () => ({
  inspectSocialPreview: vi.fn().mockResolvedValue({
    url: "https://example.com/",
    extracted: {
      title: "Example",
      description: "Example description",
      openGraph: {
        "og:title": "Example",
        "og:description": "Example description",
        "og:image": "https://example.com/image.png",
      },
      twitter: {},
    },
    previews: {
      openGraph: { valid: true, missing: [], warnings: [], fields: {}, platform: "openGraph" },
      twitter: { valid: true, missing: [], warnings: [], fields: {}, platform: "twitter" },
      google: { valid: true, missing: [], warnings: [], fields: {}, platform: "google" },
    },
  }),
}));

describe("GET /inspect", () => {
  it("returns 400 when url is missing", async () => {
    const res = await worker.fetch(new Request("http://localhost/inspect"));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("INVALID_URL");
  });

  it("returns preview validation for valid url", async () => {
    const res = await worker.fetch(new Request("http://localhost/inspect?url=https://example.com"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      previews: { openGraph: { valid: boolean }; google: { valid: boolean } };
    };
    expect(body.previews.openGraph.valid).toBe(true);
    expect(body.previews.google.valid).toBe(true);
  });
});
