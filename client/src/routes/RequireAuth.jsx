import { Navigate, Outlet, useLocation } from "react-router-dom";

import { LoadingSpinner } from "../components";
import { useAuth } from "../context/AuthContext";

function RequireAuth() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner label="Validando sesion..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default RequireAuth;
