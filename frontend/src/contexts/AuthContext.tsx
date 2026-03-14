import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from "react";
import { authApi } from "../api/endpoints";

type User = { id: string; email: string; name: string | null; role: string };

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string, name?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  isReady: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [isReady, setIsReady] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setIsReady(true);
      return;
    }
    setUser(JSON.parse(localStorage.getItem("user") ?? "null"));
    setIsReady(true);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (!res.success) return { ok: false, error: res.error };
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return { ok: true };
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const res = await authApi.signup({ email, password, name });
    if (!res.success) return { ok: false, error: res.error };
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return { ok: true };
  }, []);

  const value: AuthContextValue = { user, token, login, signup, logout, isReady };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
