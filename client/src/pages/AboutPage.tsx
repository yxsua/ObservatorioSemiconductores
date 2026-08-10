import styles from "./InformationPage.module.css";

const TEAM_ROLES = [
  ["Coordinación", "Articula las necesidades del ecosistema, prioriza líneas de vigilancia y coordina la relación con academia, industria y gobierno."],
  ["Análisis e investigación", "Detecta evidencia, registra señales y construye lecturas sobre tecnologías, mercado, inversión, talento y cadena de suministro."],
  ["Validación metodológica", "Revisa trazabilidad, consistencia y criterios de señales, tendencias y alertas antes de su publicación."],
  ["Edición y comunicación", "Convierte los resultados analíticos en boletines, informes y contenidos comprensibles para cada audiencia."],
  ["Desarrollo tecnológico", "Mantiene la plataforma, los modelos de información y las herramientas que permiten consultar y exportar conocimiento."],
  ["Comité de vigilancia", "Representación académica, industrial y gubernamental que actualiza prioridades y valida los productos de mayor impacto."]
] as const;

export function AboutPage() {
  return <div className={styles.page}>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>Acerca del observatorio</p>
      <h1>Conocimiento colectivo para decisiones estratégicas</h1>
      <p>El Observatorio de Semiconductores reúne investigación, análisis y tecnología para comprender los cambios del sector y su relación con el ecosistema de Querétaro y México.</p>
    </header>
    <section>
      <div className={styles.sectionHeader}><p className={styles.eyebrow}>Propósito</p><h2>Transformar información dispersa en conocimiento útil</h2><p>El proyecto identifica, organiza, valida y comunica evidencia científica, tecnológica, industrial y económica. Sus productos apoyan la formación de talento, la vinculación, la inversión, la política pública y las decisiones empresariales.</p></div>
    </section>
    <section>
      <div className={styles.sectionHeader}><p className={styles.eyebrow}>Equipo</p><h2>Un trabajo multidisciplinario</h2><p>El observatorio se organiza por funciones complementarias. Esta estructura permite separar la captura de información, su validación y la decisión editorial.</p></div>
      <div className={styles.grid}>{TEAM_ROLES.map(([title, copy]) => <article className={`${styles.card} ${styles.teamRole}`} key={title}><strong>{title}</strong><p>{copy}</p></article>)}</div>
    </section>
    <section>
      <div className={styles.sectionHeader}><p className={styles.eyebrow}>Principios</p><h2>Cómo trabajamos</h2></div>
      <ul className={styles.principles}><li>Trazabilidad hacia la fuente original.</li><li>Separación entre análisis, validación y publicación.</li><li>Vinculación explícita con factores críticos de vigilancia.</li><li>Relevancia regional sin perder el contexto global.</li><li>Comunicación clara para audiencias diversas.</li><li>Uso responsable de automatización e inteligencia artificial, siempre con revisión humana.</li></ul>
    </section>
    <aside className={styles.callout}><h2>¿Para quién trabajamos?</h2><p>Gobierno, empresas, universidades, centros de investigación, inversionistas, estudiantes y público especializado pueden consultar productos adaptados a sus necesidades de decisión y aprendizaje.</p></aside>
  </div>;
}
