import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <main className="simple-page">
      <h1>Pagina no encontrada</h1>
      <p>La ruta solicitada no existe en el observatorio.</p>
      <Link to="/">Volver al inicio</Link>
    </main>
  );
}

export default NotFoundPage;
