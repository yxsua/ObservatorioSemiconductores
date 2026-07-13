import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface CanProps {
  permission?: string;
  anyOf?: readonly string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function Can({
  anyOf = [],
  children,
  fallback = null,
  permission
}: CanProps) {
  const auth = useAuth();
  const allowed = permission
    ? auth.hasPermission(permission)
    : auth.hasAnyPermission(anyOf);
  return allowed ? children : fallback;
}
