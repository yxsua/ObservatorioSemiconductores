import { useState } from "react";
import { Link } from "react-router-dom";
import { PUBLIC_MODULES } from "@/app/public-modules";
import logoUrl from "@/assets/logo-white-background.jpeg";
import styles from "./HomePage.module.css";

export function HomePage() {
  const [partnerPage,setPartnerPage]=useState(0);
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
            <Link className={styles.primaryAction} to="/dashboard">Ver dashboard ejecutivo</Link>
            <Link className={styles.secondaryAction} to="/industria">Explorar la industria</Link>
          </div>
        </div>
        <aside className={styles.heroPanel} aria-label="Áreas de consulta">
          <div className={styles.heroArtwork}>
            <img alt="Observatorio de Semiconductores de Querétaro" src={logoUrl} />
          </div>
          <div className={styles.heroPanelCopy}>
            <span>Información pública</span>
            <strong>Contexto + evidencia estructurada</strong>
            <p>Información para comprender la industria y seguir sus cambios relevantes.</p>
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
      <section aria-labelledby="team-title" className={styles.community}>
        <header className={styles.sectionHeader}><div><p className={styles.eyebrow}>Detrás del Observatorio</p><h2 id="team-title">Equipo de desarrollo</h2><p>Cinco personas, un proyecto compartido.</p></div></header>
        <div className={styles.teamGrid}>{Array.from({length:5},(_,index)=><article className={styles.person} key={index}><div className={styles.portrait}><svg viewBox="0 0 200 200" role="img" aria-label={`Fotografía pendiente del integrante ${index+1}`}><circle cx="100" cy="75" r="30"/><path d="M40 185v-20a60 60 0 0 1 120 0v20Z"/></svg><span>Fotografía próximamente</span></div><h3>Integrante {String(index+1).padStart(2,'0')}</h3><p>Nombre por confirmar</p></article>)}</div>
      </section>
      <section aria-labelledby="partners-title" className={styles.community} aria-roledescription="carrusel">
        <header className={styles.sectionHeader}><div><p className={styles.eyebrow}>Conexiones que suman</p><h2 id="partners-title">Instituciones y empresas aliadas</h2><p>Espacios reservados para los logos de nuestros aliados.</p></div><div className={styles.carouselControls}><button aria-label="Logos anteriores" onClick={()=>setPartnerPage(p=>(p+1)%2)}>←</button><span aria-live="polite">Grupo {partnerPage+1} de 2</span><button aria-label="Logos siguientes" onClick={()=>setPartnerPage(p=>(p+1)%2)}>→</button></div></header>
        <div className={styles.partnerGrid} key={partnerPage}>{Array.from({length:4},(_,index)=>{const number=partnerPage*4+index+1;return <div className={styles.partner} key={number}><svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 8 70 25v30L40 72 10 55V25Z"/><path d="M25 49V31h30v18M40 31v18"/></svg><strong>{index%2===0?'Institución':'Empresa'} {String(number).padStart(2,'0')}</strong><span>Logo próximamente</span></div>;})}</div>
      </section>
    </div>
  );
}
