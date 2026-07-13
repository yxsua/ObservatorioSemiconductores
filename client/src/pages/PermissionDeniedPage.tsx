import { Link, useLocation } from "react-router-dom";
import { PageFeedback } from "@/components/feedback/PageFeedback";

export function PermissionDeniedPage() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return (
    <PageFeedback
      message={from
        ? `Tu cuenta no tiene permiso para acceder a ${from}.`
        : "Tu cuenta no tiene permiso para realizar esta acción."
      }
      title="Permiso insuficiente"
    >
      <Link to="/">Volver al inicio</Link>
    </PageFeedback>
  );
}
