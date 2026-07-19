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

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
    },
    ...init,
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
    let msg: string | null = null;
    let code: string | undefined;
    if (data && typeof data === "object" && "error" in data) {
      const e = (data as { error: unknown }).error;
      if (typeof e === "string") {
        msg = e;
      } else if (e && typeof e === "object") {
        const eo = e as { code?: unknown; message?: unknown };
        if (typeof eo.message === "string") msg = eo.message;
        if (typeof eo.code === "string") code = eo.code;
      }
    }
    throw new ApiError(res.status, msg || `HTTP ${res.status}`, data, code);
  }
  return data as T;
}
