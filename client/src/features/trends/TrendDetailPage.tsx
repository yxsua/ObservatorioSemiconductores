import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { isApiError } from "@/api";
import { PageFeedback } from "@/components/feedback/PageFeedback";
import { formatPublicDate, relationNumber, relationText } from "@/features/surveillance/format";
import { ViewCounter } from "@/features/views/ViewCounter";
import { getPublicTrend } from "./trends.service";
import styles from "@/features/surveillance/Surveillance.module.css";

export function TrendDetailPage() {
  const id = Number(useParams().id);
  const valid = Number.isSafeInteger(id) && id > 0;
  const query = useQuery({ queryKey: ["public-trend", id], queryFn: ({ signal }) => getPublicTrend(id, signal), enabled: valid });
  useEffect(() => { if (query.data) document.title = query.data.title + " | Observatorio de Semiconductores"; }, [query.data]);
  if (!valid) return <PageFeedback message="El identificador no corresponde a una tendencia." title="Tendencia no encontrada"><Link to="/tendencias">Volver a tendencias</Link></PageFeedback>;
  if (query.isPending) return <PageFeedback message="Estamos consultando la información pública." title="Cargando tendencia" />;
  if (query.isError) { const missing = isApiError(query.error) && query.error.status === 404; return <PageFeedback actionLabel={missing ? undefined : "Reintentar"} message={missing ? "La tendencia no existe o ya no está activa." : "No fue posible consultar esta tendencia."} onAction={missing ? undefined : () => void query.refetch()} title={missing ? "Tendencia no encontrada" : "No pudimos cargar la tendencia"}><Link to="/tendencias">Volver a tendencias</Link></PageFeedback>; }
  const trend = query.data;
  return (
    <article className={styles.page}>
      <nav aria-label="Ruta de navegación" className={styles.breadcrumbs}><Link to="/vigilancia">Vigilancia</Link><span>/</span><Link to="/tendencias">Tendencias</Link><span>/</span><span aria-current="page">{trend.businessCode}</span></nav>
      <header className={styles.detailHeader}><div className={styles.meta}><span className={styles.badge}>Tendencia activa</span><span>{trend.businessCode}</span>{trend.direction && <span>{trend.direction.name}</span>}{trend.maturity && <span>{trend.maturity.name}</span>}<ViewCounter id={trend.id} resource="trend" /></div><h1>{trend.title}</h1><p className={styles.lead}>{trend.narrative}</p></header>
      <div className={styles.detailLayout}>
        <div className={styles.main}>
          <section aria-labelledby="trend-reading" className={styles.section}><p className={styles.eyebrow}>Lectura estratégica</p><h2 id="trend-reading">Implicaciones</h2><p>{trend.implications || "Esta tendencia todavía no incluye implicaciones públicas."}</p></section>
          <section aria-labelledby="trend-evidence" className={styles.section}><p className={styles.eyebrow}>Evidencia pública</p><h2 id="trend-evidence">Señales relacionadas</h2>{trend.signals.length === 0 ? <p className={styles.muted}>No hay señales públicas relacionadas.</p> : <ul className={styles.relationList}>{trend.signals.map((item, index) => { const relationId = relationNumber(item); const title = relationText(item, "title") || "Señal relacionada"; return <li key={relationId ?? index}><div><strong>{title}</strong><span>{relationText(item, "businessCode")}</span></div>{relationId && <Link to={"/senales/" + relationId}>Consultar señal</Link>}</li>; })}</ul>}</section>
          <section aria-labelledby="trend-actors" className={styles.section}><p className={styles.eyebrow}>Ecosistema</p><h2 id="trend-actors">Actores relacionados</h2>{trend.actors.length === 0 ? <p className={styles.muted}>No hay actores públicos relacionados.</p> : <ul className={styles.relationList}>{trend.actors.map((item, index) => <li key={relationNumber(item) ?? index}><div><strong>{relationText(item, "name") || "Actor"}</strong><span>{[relationText(item, "type"), relationText(item, "country")].filter(Boolean).join(" · ")}</span></div>{relationText(item, "website") && <a href={relationText(item, "website") || undefined} rel="noreferrer" target="_blank">Visitar sitio ↗</a>}</li>)}</ul>}</section>
        </div>
        <aside className={styles.side}><div><p className={styles.eyebrow}>Indicadores</p><h2>Base de la tendencia</h2></div><dl className={styles.metrics}><div><dt>Señales</dt><dd><strong>{trend.metrics.signalCount}</strong></dd></div><div><dt>Fuentes</dt><dd><strong>{trend.metrics.sourceCount}</strong></dd></div><div><dt>Actores</dt><dd><strong>{trend.metrics.actorCount}</strong></dd></div><div><dt>FCV</dt><dd><strong>{trend.metrics.fcvCount}</strong></dd></div></dl><dl className={styles.info}><div><dt>Primera señal</dt><dd>{formatPublicDate(trend.firstSignalDate)}</dd></div><div><dt>Última señal</dt><dd>{formatPublicDate(trend.lastSignalDate)}</dd></div></dl></aside>
      </div>
    </article>
  );
}
