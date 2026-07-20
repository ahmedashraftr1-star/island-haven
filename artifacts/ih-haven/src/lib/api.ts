const BASE = "/api";

export class ApiError extends Error {
  status: number;
  /** Machine-readable error code from the unified `{ error: { code, message } }` shape. */
  code?: string;
  data: unknown;
  constructor(status: number, message: string, data: unknown, code?: string) {
    super(message);
    this.status = status;
    this.data = data;
    this.code = code;
  }
}

/**
 * Extract a human-readable message from an API error body, accepting BOTH the
 * unified `{ error: { code, message } }` shape and the legacy `{ error: "str" }`.
 * Returns null if none is present. Use this wherever a RAW `fetch` reads the
 * response body directly (upload handlers etc. that bypass `api()`/`ApiError`).
 */
export function errorText(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const e = (body as { error?: unknown }).error;
  if (typeof e === "string") return e;
  if (
    e &&
    typeof e === "object" &&
    typeof (e as { message?: unknown }).message === "string"
  ) {
    return (e as { message: string }).message;
  }
  return null;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp("(?:^|;\\s*)" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"),
  );
  return m ? decodeURIComponent(m[1]) : null;
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  // Double-submit CSRF: echo the JS-readable `ih_csrf` cookie in a header on
  // state-changing requests. The server enforces it on cookie-authed admin
  // mutations; it's harmless on public/GET calls. `...init` first, then headers
  // last, so the merged Content-Type + CSRF + caller headers all survive.
  const method = String(init.method ?? "GET").toUpperCase();
  const csrf = method !== "GET" && method !== "HEAD" ? readCookie("ih_csrf") : null;
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    // Accept BOTH the unified `{ error: { code, message } }` shape and the legacy
    // `{ error: "<string>" }`, plus a non-JSON/empty body — so an error never
    // renders as "[object Object]" or a bare "HTTP 500".
    let code: string | undefined;
    if (data && typeof data === "object") {
      const e = (data as { error?: unknown }).error;
      if (e && typeof e === "object" && typeof (e as { code?: unknown }).code === "string") {
        code = (e as { code: string }).code;
      }
    }
    throw new ApiError(res.status, errorText(data) || `HTTP ${res.status}`, data, code);
  }
  return data as T;
}
