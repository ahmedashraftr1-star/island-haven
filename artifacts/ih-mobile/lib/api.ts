import AsyncStorage from "@react-native-async-storage/async-storage";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
// EXPO_PUBLIC_API_BASE overrides the domain-based URL (used for local dev with iOS simulator)
export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ??
  (DOMAIN ? `https://${DOMAIN}/api` : "/api");

const _apiOrigin = process.env.EXPO_PUBLIC_API_BASE
  ? process.env.EXPO_PUBLIC_API_BASE.replace(/\/api$/, "")
  : DOMAIN
    ? `https://${DOMAIN}`
    : "";

// The web app (Vite) serves static public assets such as /photos/* and
// /images/* from the *web* origin, not the API server. In production the web
// and API share a host, so WEB_BASE === _apiOrigin and nothing changes. For
// local dev the API runs on :3001 (which has no /photos route) while the web
// runs on a different port, so EXPO_PUBLIC_WEB_BASE lets you point web-only
// assets at the Vite origin (e.g. http://localhost:5180).
export const WEB_BASE =
  process.env.EXPO_PUBLIC_WEB_BASE?.replace(/\/$/, "") || _apiOrigin;

// Path prefixes for assets served by the web origin's public/ dir rather than
// the API server. resolveMedia routes these to WEB_BASE.
const WEB_ASSET_PREFIXES = ["/photos/", "/images/"];

const TOKEN_KEY = "ih_session_token";
const ADMIN_TOKEN_KEY = "ih_admin_token";

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}
export async function setToken(t: string | null): Promise<void> {
  if (t) await AsyncStorage.setItem(TOKEN_KEY, t);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}
export async function getAdminToken(): Promise<string | null> {
  return AsyncStorage.getItem(ADMIN_TOKEN_KEY);
}
export async function setAdminToken(t: string | null): Promise<void> {
  if (t) await AsyncStorage.setItem(ADMIN_TOKEN_KEY, t);
  else await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type ApiOpts = {
  method?: string;
  body?: unknown;
  admin?: boolean;
  headers?: Record<string, string>;
};

export async function api<T = unknown>(path: string, opts: ApiOpts = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers ?? {}),
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const token = opts.admin ? await getAdminToken() : await getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  let data: unknown = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await res.text();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `HTTP ${res.status}`) || `HTTP ${res.status}`;
    throw new ApiError(res.status, data, msg);
  }

  return data as T;
}

export function resolveMedia(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) {
    // Web-only public assets (/photos/*, /images/*) live on the web origin,
    // which has no /api prefix and may differ from the API host in local dev.
    if (WEB_ASSET_PREFIXES.some((p) => url.startsWith(p))) {
      return WEB_BASE ? `${WEB_BASE}${url}` : url;
    }
    return _apiOrigin ? `${_apiOrigin}${url}` : url;
  }
  return url;
}
