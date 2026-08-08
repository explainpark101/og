export type FieldStatus = "present" | "missing" | "fallback";

export type PreviewField = {
  value: string | null;
  source: string | null;
  status: FieldStatus;
};

export type PlatformPreview = {
  platform: "openGraph" | "twitter" | "google";
  fields: Record<string, PreviewField>;
  valid: boolean;
  missing: string[];
  warnings: string[];
};

export type ExtractedMeta = {
  title: string | null;
  description: string | null;
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
};

export type InspectResponse = {
  url: string;
  extracted: ExtractedMeta;
  previews: {
    openGraph: PlatformPreview;
    twitter: PlatformPreview;
    google: PlatformPreview;
  };
};
