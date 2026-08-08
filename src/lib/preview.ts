import type {
  ExtractedMeta,
  FieldStatus,
  InspectResponse,
  PlatformPreview,
  PreviewField,
} from "../types/inspect";

class MetaCollector {
  metaTags: Record<string, string> = {};
  title: string | null = null;

  meta = {
    element: (element: Element) => {
      const property = element.getAttribute("property") ?? element.getAttribute("name");
      const content = element.getAttribute("content");
      if (!property || !content) return;
      this.metaTags[property.trim().toLowerCase()] = content.trim();
    },
  };

  titleHandler = {
    text: (text: Text) => {
      const chunk = text.text.trim();
      if (!chunk) return;
      this.title = this.title ? `${this.title}${chunk}` : chunk;
    },
  };
}

function pickTag(
  tags: Record<string, string>,
  keys: string[]
): { value: string | null; source: string | null } {
  for (const key of keys) {
    const value = tags[key.toLowerCase()];
    if (value) return { value, source: key };
  }
  return { value: null, source: null };
}

function field(
  keys: string[],
  tags: Record<string, string>,
  title: string | null,
  description: string | null
): PreviewField {
  if (keys.includes("title") && title) {
    return { value: title, source: "title", status: "present" };
  }
  if (keys.includes("description") && description) {
    return { value: description, source: "description", status: "present" };
  }

  const primary = keys[0];
  const picked = pickTag(tags, keys);
  if (picked.value) {
    const status: FieldStatus = picked.source === primary ? "present" : "fallback";
    return { value: picked.value, source: picked.source, status };
  }

  return { value: null, source: primary, status: "missing" };
}

function buildPlatformPreview(
  platform: PlatformPreview["platform"],
  fields: Record<string, PreviewField>,
  required: string[],
  warnings: string[] = []
): PlatformPreview {
  const missing = required.filter((name) => fields[name]?.status === "missing");
  return {
    platform,
    fields,
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

export async function extractSocialMeta(html: string): Promise<ExtractedMeta> {
  const collector = new MetaCollector();
  const rewriter = new HTMLRewriter()
    .on("meta", collector.meta)
    .on("title", collector.titleHandler);

  await rewriter.transform(new Response(html)).text();

  const openGraph: Record<string, string> = {};
  const twitter: Record<string, string> = {};

  for (const [key, value] of Object.entries(collector.metaTags)) {
    if (key.startsWith("og:")) openGraph[key] = value;
    if (key.startsWith("twitter:")) twitter[key] = value;
  }

  const description =
    collector.metaTags.description ??
    openGraph["og:description"] ??
    twitter["twitter:description"] ??
    null;

  return {
    title: collector.title,
    description,
    openGraph,
    twitter,
  };
}

export function buildInspectResponse(url: string, extracted: ExtractedMeta): InspectResponse {
  const tags = { ...extracted.openGraph, ...extracted.twitter };
  if (extracted.description) tags.description = extracted.description;

  const openGraph = buildPlatformPreview(
    "openGraph",
    {
      title: field(
        ["og:title", "twitter:title", "title"],
        tags,
        extracted.title,
        extracted.description
      ),
      description: field(
        ["og:description", "twitter:description", "description"],
        tags,
        extracted.title,
        extracted.description
      ),
      image: field(["og:image", "twitter:image"], tags, extracted.title, extracted.description),
      url: field(["og:url"], tags, extracted.title, extracted.description),
      type: field(["og:type"], tags, extracted.title, extracted.description),
    },
    ["title", "description", "image"]
  );

  const twitterCard = pickTag(tags, ["twitter:card"]).value ?? "summary";
  const twitterWarnings: string[] = [];
  if (!extracted.twitter["twitter:card"]) {
    twitterWarnings.push("twitter:card not set; assuming summary");
  }

  const twitterImageRequired = twitterCard.includes("image") || twitterCard === "player";
  const twitterRequired = ["title", "description", ...(twitterImageRequired ? ["image"] : [])];

  const twitter = buildPlatformPreview(
    "twitter",
    {
      card: {
        value: twitterCard,
        source: extracted.twitter["twitter:card"] ? "twitter:card" : null,
        status: extracted.twitter["twitter:card"] ? "present" : "fallback",
      },
      title: field(
        ["twitter:title", "og:title", "title"],
        tags,
        extracted.title,
        extracted.description
      ),
      description: field(
        ["twitter:description", "og:description", "description"],
        tags,
        extracted.title,
        extracted.description
      ),
      image: field(["twitter:image", "og:image"], tags, extracted.title, extracted.description),
      site: field(["twitter:site"], tags, extracted.title, extracted.description),
    },
    twitterRequired,
    twitterWarnings
  );

  const google = buildPlatformPreview(
    "google",
    {
      title: field(["title", "og:title"], tags, extracted.title, extracted.description),
      description: field(
        ["description", "og:description"],
        tags,
        extracted.title,
        extracted.description
      ),
    },
    ["title", "description"]
  );

  return {
    url,
    extracted,
    previews: { openGraph, twitter, google },
  };
}

export async function inspectSocialPreview(url: string, html: string): Promise<InspectResponse> {
  const extracted = await extractSocialMeta(html);
  return buildInspectResponse(url, extracted);
}
