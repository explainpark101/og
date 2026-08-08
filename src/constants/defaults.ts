/** Max time (ms) to wait for the target URL to respond. */
export const FETCH_TIMEOUT_MS = 15_000;

/** Allowed URL schemes for security. */
export const ALLOWED_SCHEMES = ["http:", "https:"] as const;
