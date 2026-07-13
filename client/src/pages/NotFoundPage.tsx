import { Link } from "react-router-dom";
import { PageFeedback } from "@/components/feedback/PageFeedback";

export function NotFoundPage() {
  return (
    <PageFeedback
      message="La página solicitada no existe o cambió de ubicación."
      title="Página no encontrada"
    >
      <Link to="/">Volver al inicio</Link>
    </PageFeedback>
  );
}
