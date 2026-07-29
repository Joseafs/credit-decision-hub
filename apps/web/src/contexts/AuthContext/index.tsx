import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getSession, login, logout } from "../../api/auth";
import type { AuthContextValue } from "./types";

const AuthContext = createContext<AuthContextValue | null>(null);
const anonymousContext: AuthContextValue = {
  status: "anonymous",
  user: null,
  signIn: async () => undefined,
  signOut: async () => undefined,
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<Pick<AuthContextValue, "status" | "user">>(
    { status: "loading", user: null },
  );

  useEffect(() => {
    const controller = new AbortController();
    getSession(controller.signal)
      .then(({ user }) => setState({ status: "authenticated", user }))
      .catch(() => setState({ status: "anonymous", user: null }));
    return () => controller.abort();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      async signIn(email, password) {
        const { user } = await login({ email, password });
        setState({ status: "authenticated", user });
      },
      async signOut() {
        await logout();
        setState({ status: "anonymous", user: null });
      },
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  return context ?? anonymousContext;
};
