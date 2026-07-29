import {
  authSessionSchema,
  loginSchema,
  type AuthSession,
  type LoginInput,
} from "@credit-decision-hub/contracts";

import { resolveApiUrl } from "./api-url";
import { requestJson } from "./http";

export const login = (input: LoginInput): Promise<AuthSession> =>
  requestJson("/api/auth/login", authSessionSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loginSchema.parse(input)),
  });

export const getSession = (signal?: AbortSignal): Promise<AuthSession> =>
  requestJson(
    "/api/auth/session",
    authSessionSchema,
    signal ? { signal } : undefined,
  );

export const logout = async (): Promise<void> => {
  const response = await fetch(resolveApiUrl("/api/auth/logout"), {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Logout failed");
};
