import { Link } from "react-router-dom";
import { PUBLIC_MODULES } from "@/app/public-modules";
import logoUrl from "@/assets/logo-white-background.jpeg";
import styles from "./HomePage.module.css";

export function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Conocimiento para decisiones estratégicas</p>
          <h1>Comprende el presente y el futuro de los semiconductores</h1>
          <p className={styles.lead}>
            Explora información editorial y evidencia validada sobre la industria,
            el ecosistema regional y los cambios que están definiendo al sector.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primaryAction} to="/vigilancia">Explorar vigilancia</Link>
            <Link className={styles.secondaryAction} to="/boletines">Consultar boletines</Link>
          </div>
        </div>
        <aside className={styles.heroPanel} aria-label="Áreas de consulta">
          <div className={styles.heroArtwork}>
            <img alt="Observatorio de Semiconductores de Querétaro" src={logoUrl} />
          </div>
          <div className={styles.heroPanelCopy}>
            <span>Información pública</span>
            <strong>Publicaciones + evidencia estructurada</strong>
            <p>Contenido editorial conectado con señales, tendencias y alertas.</p>
          </div>
        </aside>
      </section>

      <section aria-labelledby="modules-title" className={styles.modules}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Explora por módulo</p>
            <h2 id="modules-title">Una entrada clara para cada tipo de conocimiento</h2>
          </div>
          <Link to="/contenido">Ver todo el contenido</Link>
        </header>
        <div className={styles.moduleGrid}>
          {PUBLIC_MODULES.map((module, index) => (
            <Link className={`${styles.moduleCard} ${module.id === "surveillance" ? styles.featuredModule : ""}`} key={module.id} to={module.path}>
              <span className={styles.moduleNumber} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <strong>{module.label}</strong>
              <p>{module.description}</p>
              <span className={styles.cardAction}>Explorar <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="surveillance-title" className={styles.surveillance}>
        <div>
          <p className={styles.eyebrow}>Vigilancia tecnológica</p>
          <h2 id="surveillance-title">De acontecimientos aislados a conocimiento accionable</h2>
          <p>
            El observatorio organiza evidencia en tres niveles relacionados para
            facilitar el seguimiento de cambios relevantes.
          </p>
        </div>
        <ol className={styles.surveillanceSteps}>
          <li><Link to="/senales"><span>01</span><strong>Señales</strong><small>Evidencia verificable</small></Link></li>
          <li><Link to="/tendencias"><span>02</span><strong>Tendencias</strong><small>Patrones relacionados</small></Link></li>
          <li><Link to="/alertas"><span>03</span><strong>Alertas</strong><small>Atención prioritaria</small></Link></li>
        </ol>
      </section>
    </div>
  );
}
