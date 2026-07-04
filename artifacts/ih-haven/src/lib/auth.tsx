import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { api, ApiError } from "./api";
// Single source of truth — imported types-only (no runtime) from the pg-free
// "@workspace/db/contracts" export so frontend and backend can never drift.
// Re-exported so every existing `from "@/lib/auth"` import keeps working.
import type { UserRole, ExtraLink } from "@workspace/db/contracts";
export type { UserRole, ExtraLink };

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
  bio: string;
  jobTitle: string;
  phone: string;
  skills: string;
  portfolioUrl: string;
  linkedinUrl: string;
  behanceUrl: string;
  githubUrl: string;
  otherLinks: ExtraLink[];
  createdAt: string;
  updatedAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (u: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);



export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Monotonic version: any auth-mutating call (login/register/logout/setUser)
  // bumps it; refresh() captures a snapshot and discards its result if it
  // changed mid-flight. Prevents a stale /auth/me 401 from clobbering a
  // freshly-authenticated state right after login.
  const versionRef = useRef(0);

  const refresh = useCallback(async () => {
    const v = ++versionRef.current;
    try {
      const r = await api<{ user: AuthUser }>("/auth/me");
      if (versionRef.current !== v) return;
      setUser(r.user);
    } catch (e) {
      if (versionRef.current !== v) return;
      if (!(e instanceof ApiError) || e.status !== 401) {
        // eslint-disable-next-line no-console
        console.warn("auth refresh failed", e);
      }
      setUser(null);
    } finally {
      if (versionRef.current === v) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const r = await api<{ user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      versionRef.current++;
      setUser(r.user);
      setLoading(false);
      return r.user;
    },
    [],
  );

  const register = useCallback<AuthContextValue["register"]>(async (input) => {
    const r = await api<{ user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    versionRef.current++;
    setUser(r.user);
    setLoading(false);
    return r.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      versionRef.current++;
      setUser(null);
    }
  }, []);

  const setUserSafe = useCallback((u: AuthUser | null) => {
    versionRef.current++;
    setUser(u);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, refresh, login, register, logout, setUser: setUserSafe }),
    [user, loading, refresh, login, register, logout, setUserSafe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  freelancer: "مستقلّ",
  graduate: "خرّيج جامعي",
  student: "طالب جامعي",
  other: "عضو",
  expert: "خبير / مرشد",
};
