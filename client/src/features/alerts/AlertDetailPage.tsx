import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { isApiError } from "@/api";
import { PageFeedback } from "@/components/feedback/PageFeedback";
import { formatPublicDate, relationNumber, relationText } from "@/features/surveillance/format";
import { getPublicAlert } from "./alerts.service";
import styles from "@/features/surveillance/Surveillance.module.css";

export function AlertDetailPage() {
  const id = Number(useParams().id);
  const valid = Number.isSafeInteger(id) && id > 0;
  const query = useQuery({ queryKey: ["public-alert", id], queryFn: ({ signal }) => getPublicAlert(id, signal), enabled: valid });
  useEffect(() => { if (query.data) document.title = query.data.title + " | Observatorio de Semiconductores"; }, [query.data]);
  if (!valid) return <PageFeedback message="El identificador no corresponde a una alerta." title="Alerta no encontrada"><Link to="/alertas">Volver a alertas</Link></PageFeedback>;
  if (query.isPending) return <PageFeedback message="Estamos consultando la información publicada." title="Cargando alerta" />;
  if (query.isError) { const missing = isApiError(query.error) && query.error.status === 404; return <PageFeedback actionLabel={missing ? undefined : "Reintentar"} message={missing ? "La alerta no existe o no está disponible públicamente." : "No fue posible consultar esta alerta."} onAction={missing ? undefined : () => void query.refetch()} title={missing ? "Alerta no encontrada" : "No pudimos cargar la alerta"}><Link to="/alertas">Volver a alertas</Link></PageFeedback>; }
  const alert = query.data;
  const levelClass = alert.level ? styles[alert.level.code.toLowerCase()] : "";
  return (
    <article className={styles.page}>
      <nav aria-label="Ruta de navegación" className={styles.breadcrumbs}><Link to="/vigilancia">Vigilancia</Link><span>/</span><Link to="/alertas">Alertas</Link><span>/</span><span aria-current="page">{alert.businessCode}</span></nav>
      <header className={styles.detailHeader}><div className={styles.meta}>{alert.level && <span className={styles.badge + " " + levelClass}>Nivel {alert.level.name}</span>}<span>{alert.status.name}</span><span>{alert.businessCode}</span><span>{alert.origin.name}</span></div><h1>{alert.title}</h1><p className={styles.lead}>{alert.executiveSummary}</p></header>
      <div className={styles.detailLayout}>
        <div className={styles.main}>
          <section aria-labelledby="alert-action" className={styles.section}><p className={styles.eyebrow}>Orientación</p><h2 id="alert-action">Implicaciones y recomendaciones</h2><h3>Implicaciones</h3><p>{alert.implications || "Sin implicaciones públicas adicionales."}</p><h3>Recomendaciones</h3><p>{alert.recommendations || "Sin recomendaciones públicas adicionales."}</p>{alert.activationRule && <><h3>Regla de activación</h3><p>{alert.activationRule}</p></>}</section>
          <section aria-labelledby="alert-audiences" className={styles.section}><p className={styles.eyebrow}>Destinatarios</p><h2 id="alert-audiences">Audiencias</h2>{alert.audiences.length === 0 ? <p className={styles.muted}>No hay audiencias públicas especificadas.</p> : <ul className={styles.audienceList}>{alert.audiences.map((item) => <li key={item.code}>{item.name}</li>)}</ul>}</section>
          <section aria-labelledby="alert-signals" className={styles.section}><p className={styles.eyebrow}>Evidencia pública</p><h2 id="alert-signals">Señales relacionadas</h2>{alert.signals.length === 0 ? <p className={styles.muted}>No hay señales públicas relacionadas.</p> : <ul className={styles.relationList}>{alert.signals.map((item, index) => { const relationId = relationNumber(item); return <li key={relationId ?? index}><div><strong>{relationText(item, "title") || "Señal relacionada"}</strong><span>{relationText(item, "businessCode")}</span></div>{relationId && <Link to={"/senales/" + relationId}>Consultar señal</Link>}</li>; })}</ul>}</section>
          <section aria-labelledby="alert-trends" className={styles.section}><p className={styles.eyebrow}>Contexto estratégico</p><h2 id="alert-trends">Tendencias relacionadas</h2>{alert.trends.length === 0 ? <p className={styles.muted}>No hay tendencias públicas relacionadas.</p> : <ul className={styles.relationList}>{alert.trends.map((item, index) => { const relationId = relationNumber(item); return <li key={relationId ?? index}><div><strong>{relationText(item, "title") || "Tendencia relacionada"}</strong><span>{[relationText(item, "businessCode"), relationText(item, "maturity")].filter(Boolean).join(" · ")}</span></div>{relationId && <Link to={"/tendencias/" + relationId}>Consultar tendencia</Link>}</li>; })}</ul>}</section>
        </div>
        <aside className={styles.side}><div><p className={styles.eyebrow}>Vigencia</p><h2>Datos de respuesta</h2></div><dl className={styles.info}><div><dt>Generación</dt><dd>{formatPublicDate(alert.generationDate)}</dd></div><div><dt>Publicación</dt><dd>{formatPublicDate(alert.publicationDate)}</dd></div><div><dt>Fecha límite</dt><dd>{formatPublicDate(alert.responseDeadline)}</dd></div><div><dt>Estado</dt><dd>{alert.status.name}</dd></div></dl><dl className={styles.metrics}><div><dt>Señales</dt><dd><strong>{alert.metrics.signalCount}</strong></dd></div><div><dt>Tendencias</dt><dd><strong>{alert.metrics.trendCount}</strong></dd></div><div><dt>Audiencias</dt><dd><strong>{alert.metrics.audienceCount}</strong></dd></div></dl></aside>
      </div>
    </article>
  );
}
