import { describe, it, expect, beforeAll } from "vitest";
import { validateUrl } from "../../src/lib/url";
import { buildInspectResponse } from "../../src/lib/preview";

type Handler = {
  element?: (element: MockElement) => void;
  text?: (text: { text: string }) => void;
};

class MockElement {
  private attrs = new Map<string, string>();

  constructor(tag: string, rawAttrs = "") {
    this.tag = tag;
    const attrRegex = /([a-zA-Z_:.-]+)\s*=\s*["']([^"']*)["']/g;
    let match: RegExpExecArray | null;
    while ((match = attrRegex.exec(rawAttrs)) !== null) {
      this.attrs.set(match[1].toLowerCase(), match[2]);
    }
  }

  private tag: string;

  getAttribute(name: string): string | null {
    return this.attrs.get(name.toLowerCase()) ?? null;
  }
}

class MockHTMLRewriter {
  private handlers = new Map<string, Handler>();

  on(selector: string, handler: Handler) {
    this.handlers.set(selector, handler);
    return this;
  }

  transform(response: Response): Response {
    return {
      text: async () => {
        const html = await response.text();
        MockHTMLRewriter.applyHandlers(html, this.handlers);
        return html;
      },
    } as Response;
  }

  static applyHandlers(html: string, handlers: Map<string, Handler>): void {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const titleHandler = handlers.get("title");
    if (titleHandler?.text && titleMatch) {
      titleHandler.text({ text: titleMatch[1].replace(/<[^>]+>/g, "") });
    }

    const metaHandler = handlers.get("meta");
    if (metaHandler?.element) {
      const metaRegex = /<meta\s+([^>]+)>/gi;
      let match: RegExpExecArray | null;
      while ((match = metaRegex.exec(html)) !== null) {
        metaHandler.element(new MockElement("meta", match[1]));
      }
    }
  }
}

beforeAll(() => {
  (globalThis as { HTMLRewriter?: typeof MockHTMLRewriter }).HTMLRewriter =
    MockHTMLRewriter as unknown as typeof HTMLRewriter;
});

describe("validateUrl", () => {
  it("rejects invalid urls", () => {
    expect(validateUrl(undefined)).toBeNull();
    expect(validateUrl("ftp://example.com")).toBeNull();
  });

  it("accepts http and https urls", () => {
    expect(validateUrl("https://example.com")).toBe("https://example.com/");
  });
});

describe("extractSocialMeta", () => {
  it("extracts title, description, og and twitter tags", async () => {
    const { extractSocialMeta } = await import("../../src/lib/preview");
    const html = `<!doctype html><html><head>
      <title>Page Title</title>
      <meta name="description" content="Meta description" />
      <meta property="og:title" content="OG Title" />
      <meta property="og:image" content="https://cdn.example.com/image.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Twitter Title" />
    </head><body></body></html>`;

    const extracted = await extractSocialMeta(html);
    expect(extracted.title).toBe("Page Title");
    expect(extracted.description).toBe("Meta description");
    expect(extracted.openGraph["og:title"]).toBe("OG Title");
    expect(extracted.twitter["twitter:card"]).toBe("summary_large_image");
  });
});

describe("buildInspectResponse", () => {
  it("flags missing open graph image", () => {
    const result = buildInspectResponse("https://example.com/", {
      title: "Title",
      description: "Description",
      openGraph: { "og:title": "Title", "og:description": "Description" },
      twitter: {},
    });

    expect(result.previews.openGraph.valid).toBe(false);
    expect(result.previews.openGraph.missing).toContain("image");
    expect(result.previews.google.valid).toBe(true);
  });
});
