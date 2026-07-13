import { Link } from "react-router-dom";
import type { PublicModule } from "@/app/public-modules";
import styles from "./ModuleLandingPage.module.css";

interface ModuleLandingPageProps {
  module: PublicModule;
}

export function ModuleLandingPage({ module }: ModuleLandingPageProps) {
  const isSurveillance = module.source.kind === "domain";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Módulo del observatorio</p>
        <h1>{module.label}</h1>
        <p>{module.description}</p>
      </header>

      {isSurveillance ? (
        <section aria-labelledby="surveillance-resources" className={styles.section}>
          <h2 id="surveillance-resources">Explora la vigilancia tecnológica</h2>
          <div className={styles.grid}>
            <Link className={styles.card} to="/senales">
              <strong>Señales</strong>
              <span>Acontecimientos verificables que indican posibles cambios.</span>
            </Link>
            <Link className={styles.card} to="/tendencias">
              <strong>Tendencias</strong>
              <span>Patrones construidos a partir de señales relacionadas.</span>
            </Link>
            <Link className={styles.card} to="/alertas">
              <strong>Alertas</strong>
              <span>Situaciones publicadas que requieren atención o seguimiento.</span>
            </Link>
          </div>
        </section>
      ) : (
        <section aria-labelledby="module-content" className={styles.pending}>
          <h2 id="module-content">Contenido del módulo</h2>
          <p>
            Las publicaciones de este módulo se mostrarán aquí conforme sean
            generadas y publicadas por el equipo editorial.
          </p>
          <Link to="/contenido">Explorar todo el contenido publicado</Link>
        </section>
      )}
    </div>
  );
}
