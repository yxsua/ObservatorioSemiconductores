import { createContext, useContext } from "react";
import type { ApiError } from "@/api";
import type {
  AuthStatus,
  LoginInput,
  RegisterInput,
  User
} from "./types";

export interface AuthContextValue {
  status: AuthStatus;
  token: string | null;
  user: User | null;
  restoreError: ApiError | null;
  sessionNotice: "expired" | null;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
  restore: () => Promise<void>;
  dismissSessionNotice: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: readonly string[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }
  return context;
}
