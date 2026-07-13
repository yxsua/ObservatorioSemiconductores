import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { PageFeedback } from "@/components/feedback/PageFeedback";

export function RouteErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `La ruta respondió con estado ${error.status}.`
    : "Ocurrió un error inesperado al mostrar esta página.";
  return (
    <main className="standalone-feedback">
      <PageFeedback message={message} title="No pudimos mostrar la página">
        <Link to="/">Volver al inicio</Link>
      </PageFeedback>
    </main>
  );
}
