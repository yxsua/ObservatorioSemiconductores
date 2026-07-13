import { Link } from "react-router-dom";

import DashboardOverview from "../components/DashboardOverview";
import PageCard from "../components/PageCard";
import navigationItems from "../routes/navigation";

const pageItems = navigationItems.filter((item) => item.path !== "/");

function LandingPage() {
  return (
    <section className="landing-page">
      <div className="landing-hero">
        <div>
          <p className="eyebrow">Plataforma del observatorio</p>
          <h1>Monitoreo de senales, tendencias y alertas del ecosistema semiconductor.</h1>
          <p>
            Navega por las secciones principales desde la barra superior o desde
            estas cartas de acceso rapido. La cuenta es opcional: puedes
            consultar el observatorio completo sin iniciar sesion.
          </p>
        </div>

        <div className="landing-summary">
          <span>Modulo inicial</span>
          <strong>Vigilancia tecnologica</strong>
          <p>Fuentes, senales, tendencias, alertas y contenido editorial.</p>
          <Link className="button" to="/dashboard">
            Ver dashboard
          </Link>
        </div>
      </div>

      <DashboardOverview compact />

      <div className="page-grid">
        {pageItems.map((item) => (
          <PageCard
            key={item.path}
            title={item.title}
            description={item.description}
            tag={item.tag}
            to={item.path}
          />
        ))}
      </div>
    </section>
  );
}

export default LandingPage;
