import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { isApiError } from "@/api";
import { PageFeedback } from "@/components/feedback/PageFeedback";
import { ViewCounter } from "@/features/views/ViewCounter";
import { formatSignalDate, signalLevelLabel } from "./signal-format";
import { getPublicSignal } from "./signals.service";
import styles from "./Signals.module.css";

export function SignalDetailPage() {
  const { id: rawId } = useParams();
  const id = Number(rawId);
  const validId = Number.isSafeInteger(id) && id > 0;
  const query = useQuery({
    queryKey: ["public-signal", id],
    queryFn: ({ signal }) => getPublicSignal(id, signal),
    enabled: validId
  });

  useEffect(() => {
    if (!query.data) return;
    document.title = `${query.data.title} | Observatorio de Semiconductores`;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = query.data.summary.slice(0, 160);
  }, [query.data]);

  if (!validId) return (
    <PageFeedback
      message="El identificador solicitado no corresponde a una señal."
      title="Señal no encontrada"
    >
      <Link to="/senales">Volver a señales</Link>
    </PageFeedback>
  );

  if (query.isPending) return (
    <PageFeedback
      message="Estamos consultando la información validada."
      title="Cargando señal"
    />
  );

  if (query.isError) {
    const notFound = isApiError(query.error) && query.error.status === 404;
    return (
      <PageFeedback
        actionLabel={notFound ? undefined : "Reintentar"}
        message={notFound
          ? "La señal no existe o ya no está disponible para consulta pública."
          : "No fue posible consultar esta señal."
        }
        onAction={notFound ? undefined : () => void query.refetch()}
        title={notFound ? "Señal no encontrada" : "No pudimos cargar la señal"}
      >
        <Link to="/senales">Volver a señales</Link>
      </PageFeedback>
    );
  }

  const signal = query.data;
  return (
    <article className={styles.detailPage}>
      <nav aria-label="Ruta de navegación" className={styles.breadcrumbs}>
        <Link to="/vigilancia">Vigilancia</Link><span aria-hidden="true">/</span>
        <Link to="/senales">Señales</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{signal.businessCode}</span>
      </nav>

      <header className={styles.detailHeader}>
        <div className={styles.detailMeta}>
          <span>{signal.businessCode}</span>
          <span className={`${styles.priority} ${styles[`priority${signal.priority}`]}`}>
            Prioridad {signalLevelLabel(signal.priority).toLocaleLowerCase("es-MX")}
          </span>
          <span>Validada</span>
          <ViewCounter id={signal.id} resource="signal" />
        </div>
        <h1>{signal.title}</h1>
        <p>{signal.summary}</p>
      </header>

      <div className={styles.detailLayout}>
        <div className={styles.detailMain}>
          <section aria-labelledby="assessment-title" className={styles.detailSection}>
            <div className={styles.sectionHeading}>
              <div><p className={styles.eyebrow}>Evaluación</p><h2 id="assessment-title">Perfil de la señal</h2></div>
              <div className={styles.ipsScore}><strong>{signal.ips}</strong><span>de 27 IPS</span></div>
            </div>
            <dl className={styles.assessmentGrid}>
              <div><dt>Impacto</dt><dd>{signal.impact.name}</dd></div>
              <div><dt>Urgencia</dt><dd>{signal.urgency.name}</dd></div>
              <div><dt>Confiabilidad</dt><dd>{signal.reliability.name}</dd></div>
              <div><dt>Alcance</dt><dd>{signal.scope.name}</dd></div>
              <div><dt>Tipo de señal</dt><dd>{signal.signalType.name}</dd></div>
              <div><dt>Prioridad</dt><dd>{signalLevelLabel(signal.priority)}</dd></div>
            </dl>
            <p className={styles.ipsNote}>El Índice de Prioridad de Señal es calculado por el backend a partir de los criterios metodológicos; el portal no lo recalcula.</p>
          </section>

          <section aria-labelledby="classification-title" className={styles.detailSection}>
            <p className={styles.eyebrow}>Clasificación</p>
            <h2 id="classification-title">Contexto temático</h2>
            <dl className={styles.contextGrid}>
              <div><dt>Categoría</dt><dd>{signal.category.name}</dd></div>
              <div><dt>Factor crítico de vigilancia</dt><dd>{signal.category.fcv.name}</dd></div>
              <div><dt>Fecha de publicación</dt><dd>{formatSignalDate(signal.publicationDate)}</dd></div>
              <div><dt>Fecha de captura</dt><dd>{formatSignalDate(signal.captureDate)}</dd></div>
            </dl>
            {signal.keywords.length > 0 && (
              <div className={styles.keywords}>
                <h3>Palabras clave</h3>
                <ul>{signal.keywords.map((keyword) => <li key={keyword.id}>{keyword.name}</li>)}</ul>
              </div>
            )}
          </section>

          <section aria-labelledby="relations-title" className={styles.detailSection}>
            <p className={styles.eyebrow}>Relaciones públicas</p>
            <h2 id="relations-title">Conocimiento relacionado</h2>
            {!signal.relations.linkedToTrend && !signal.relations.linkedToAlert ? (
              <p className={styles.muted}>Esta señal todavía no tiene relaciones públicas disponibles.</p>
            ) : (
              <ul className={styles.relations}>
                {signal.relations.linkedToTrend && (
                  <li><div><strong>Relacionada con tendencias</strong><span>La API pública confirma al menos un vínculo validado.</span></div><Link to="/tendencias">Explorar tendencias</Link></li>
                )}
                {signal.relations.linkedToAlert && (
                  <li><div><strong>Relacionada con alertas</strong><span>La API pública confirma al menos un vínculo publicado.</span></div><Link to="/alertas">Explorar alertas</Link></li>
                )}
              </ul>
            )}
          </section>
        </div>

        <aside className={styles.sourcePanel}>
          <p className={styles.eyebrow}>Evidencia</p>
          <h2>Fuente original</h2>
          <dl>
            <div><dt>Fuente</dt><dd>{signal.source.name}</dd></div>
            <div><dt>Publicada</dt><dd>{formatSignalDate(signal.publicationDate)}</dd></div>
          </dl>
          <a href={signal.evidenceUrl} rel="noreferrer" target="_blank">
            Consultar evidencia <span aria-hidden="true">↗</span>
          </a>
          <p className={styles.sourceNote}>El enlace abre el recurso externo utilizado para documentar la señal.</p>
        </aside>
      </div>
    </article>
  );
}
