import type { User } from "@credit-decision-hub/contracts";

export type AuthContextValue = {
  status: "loading" | "authenticated" | "anonymous";
  user: User | null;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
};
