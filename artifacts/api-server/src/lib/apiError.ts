import type { Response } from "express";

/**
 * Canonical error `code`s, keyed to HTTP status. The client can switch on
 * `error.code` instead of parsing Arabic message strings. Anything unmapped
 * falls back to `server_error` (5xx) or `error`.
 */
export const ERROR_CODES: Record<number, string> = {
  400: "bad_request",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  422: "validation",
  429: "rate_limited",
  500: "server_error",
};

export function codeFor(status: number): string {
  return ERROR_CODES[status] ?? (status >= 500 ? "server_error" : "error");
}

/**
 * Standard error response: `{ error: { code, message }, ...extra }`.
 *
 * The unified shape is the `error` object; structured siblings some clients read
 * (validation `details` / `issues`) stay TOP-LEVEL via `extra`, so existing
 * consumers keep working. Returns the Response so handlers can `return fail(...)`.
 *
 * Most existing routes don't call this directly — the `res.json` normalizer in
 * app.ts rewrites their legacy `{ error: "<string>" }` bodies into this same
 * shape automatically. Use `fail()` in new code and where a handler builds an
 * error explicitly.
 */
export function fail(
  res: Response,
  status: number,
  message: string,
  extra?: Record<string, unknown>,
): Response {
  return res
    .status(status)
    .json({ error: { code: codeFor(status), message }, ...(extra ?? {}) });
}
