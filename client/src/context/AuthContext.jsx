import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getProfileRequest,
  loginRequest,
  registerRequest,
} from "../services/authApi";

const TOKEN_KEY = "observatorio.auth.token";
const USER_KEY = "observatorio.auth.user";

const AuthContext = createContext(null);

function readStoredUser() {
  const rawUser = window.localStorage.getItem(USER_KEY);

  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    window.localStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = useState(readStoredUser);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  const persistSession = useCallback((nextUser, nextToken) => {
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    getProfileRequest(token)
      .then((profile) => {
        if (!isMounted) return;
        window.localStorage.setItem(USER_KEY, JSON.stringify(profile));
        setUser(profile);
      })
      .catch(() => {
        if (!isMounted) return;
        logout();
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [logout, token]);

  const login = useCallback(
    async (credentials) => {
      const result = await loginRequest(credentials);
      persistSession(result.user, result.token);
      return result.user;
    },
    [persistSession],
  );

  const register = useCallback(
    async (data) => {
      const result = await registerRequest(data);
      persistSession(result.user, result.token);
      return result.user;
    },
    [persistSession],
  );

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      logout,
      register,
      token,
      user,
    }),
    [isLoading, login, logout, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}
