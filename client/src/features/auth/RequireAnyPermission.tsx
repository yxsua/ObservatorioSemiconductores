import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface RequireAnyPermissionProps {
  permissions: readonly string[];
}

export function RequireAnyPermission({ permissions }: RequireAnyPermissionProps) {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.hasAnyPermission(permissions)) {
    return <Navigate
      replace
      state={{ from: location.pathname }}
      to="/sin-permiso"
    />;
  }
  return <Outlet />;
}
