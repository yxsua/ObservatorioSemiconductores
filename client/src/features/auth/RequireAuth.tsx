import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PageFeedback } from "@/components/feedback/PageFeedback";
import { Button } from "@/components/ui/Button";
import { useAuth } from "./AuthContext";

export function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === "restoring") {
    return <PageFeedback
      message="Estamos comprobando que tu sesión siga vigente."
      title="Restaurando sesión"
    />;
  }

  if (auth.status === "restore-error") {
    return (
      <PageFeedback
        actionLabel="Reintentar"
        message={auth.restoreError?.message || "No fue posible restaurar la sesión."}
        onAction={() => void auth.restore()}
        title="No pudimos comprobar tu sesión"
      >
        <Button onClick={auth.logout}>Cerrar sesión</Button>
      </PageFeedback>
    );
  }

  if (auth.status !== "authenticated") {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate
      replace
      state={{ returnTo }}
      to="/iniciar-sesion"
    />;
  }

  return <Outlet />;
}
