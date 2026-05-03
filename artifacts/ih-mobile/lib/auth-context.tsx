import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setToken } from "./api";
import type { CurrentUser } from "./types";

interface AuthState {
  user: CurrentUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; fullName: string; role: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api<{ user: CurrentUser }>("/auth/me");
      setUser(me.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: CurrentUser }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    await setToken(res.token);
    setUser(res.user);
  }, []);

  const signUp = useCallback(
    async (input: { email: string; password: string; fullName: string; role: string }) => {
      const res = await api<{ token: string; user: CurrentUser }>("/auth/register", {
        method: "POST",
        body: input,
      });
      await setToken(res.token);
      setUser(res.user);
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    await setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, signIn, signUp, signOut, refresh }),
    [user, loading, signIn, signUp, signOut, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
