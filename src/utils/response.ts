import type { Context } from "hono";

export function jsonError(
  c: Context,
  message: string,
  code: string,
  status: 400 | 404 | 502 = 400
) {
  return c.json({ error: message, code }, { status });
}

export function jsonSuccess<T>(c: Context, data: T, status: 200 = 200) {
  return c.json(data, { status });
}
