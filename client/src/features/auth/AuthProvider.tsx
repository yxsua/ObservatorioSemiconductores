import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  isApiError,
  subscribeToUnauthorized
} from "@/api";
import { AuthContext, type AuthContextValue } from "./AuthContext";
import * as authService from "./auth.service";
import {
  readStoredToken,
  removeStoredToken,
  storeToken
} from "./session-storage";
import type {
  AuthData,
  AuthStatus,
  LoginInput,
  RegisterInput,
  User
} from "./types";

interface SessionState {
  status: AuthStatus;
  token: string | null;
  user: User | null;
  restoreError: ApiError | null;
  sessionNotice: "expired" | null;
}

const anonymousState: SessionState = {
  status: "anonymous",
  token: null,
  user: null,
  restoreError: null,
  sessionNotice: null
};

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const initialToken = useRef(readStoredToken()).current;
  const [session, setSession] = useState<SessionState>(() => initialToken
    ? {
        status: "restoring",
        token: initialToken,
        user: null,
        restoreError: null,
        sessionNotice: null
      }
    : anonymousState
  );

  const clearSession = useCallback((sessionNotice: "expired" | null) => {
    removeStoredToken();
    queryClient.clear();
    setSession({ ...anonymousState, sessionNotice });
  }, [queryClient]);

  const logout = useCallback(() => clearSession(null), [clearSession]);

  const acceptSession = useCallback((data: AuthData) => {
    storeToken(data.token);
    setSession({
      status: "authenticated",
      token: data.token,
      user: data.user,
      restoreError: null,
      sessionNotice: null
    });
  }, []);

  const restore = useCallback(async () => {
    const token = readStoredToken();
    if (!token) {
      clearSession(null);
      return;
    }
    setSession((current) => ({
      ...current,
      status: "restoring",
      token,
      restoreError: null,
      sessionNotice: null
    }));
    try {
      const user = await authService.getProfile(token);
      setSession({
        status: "authenticated",
        token,
        user,
        restoreError: null,
        sessionNotice: null
      });
    } catch (error) {
      if (isApiError(error) && (error.status === 401 || error.status === 403)) {
        clearSession("expired");
        return;
      }
      setSession({
        status: "restore-error",
        token,
        user: null,
        restoreError: isApiError(error)
          ? error
          : new ApiError("No fue posible restaurar la sesión.", {
              status: 0,
              code: "SESSION_RESTORE_ERROR",
              cause: error
            }),
        sessionNotice: null
      });
    }
  }, [clearSession]);

  useEffect(() => {
    if (initialToken) void restore();
  }, [initialToken, restore]);

  useEffect(() => subscribeToUnauthorized(() => {
    if (readStoredToken()) clearSession("expired");
  }), [clearSession]);

  const login = useCallback(async (input: LoginInput) => {
    const data = await authService.login(input);
    acceptSession(data);
    return data.user;
  }, [acceptSession]);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await authService.register(input);
    acceptSession(data);
    return data.user;
  }, [acceptSession]);

  const permissions = useMemo(
    () => new Set(session.user?.permissions ?? []),
    [session.user]
  );

  const value = useMemo<AuthContextValue>(() => ({
    ...session,
    login,
    register,
    logout,
    restore,
    dismissSessionNotice: () => setSession((current) => ({ ...current, sessionNotice: null })),
    hasPermission: (permission) => permissions.has(permission),
    hasAnyPermission: (required) => required.some(
      (permission) => permissions.has(permission)
    )
  }), [login, logout, permissions, register, restore, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
