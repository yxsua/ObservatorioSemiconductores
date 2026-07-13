import { Navigate, Outlet } from "react-router-dom";

import { LoadingSpinner } from "../components";
import { useAuth } from "../context/AuthContext";

function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner label="Revisando sesion..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
