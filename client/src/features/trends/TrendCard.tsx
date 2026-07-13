import { Link } from "react-router-dom";
import { formatPublicDate } from "@/features/surveillance/format";
import type { Trend } from "./types";
import styles from "@/features/surveillance/Surveillance.module.css";

export function TrendCard({ trend }: { trend: Trend }) {
  return (
    <article className={styles.card}>
      <div className={styles.meta}><span className={styles.badge}>Tendencia activa</span><span>{trend.businessCode}</span></div>
      <div className={styles.cardBody}>
        <div className={styles.badges}>{trend.direction && <span>{trend.direction.name}</span>}{trend.maturity && <span>· {trend.maturity.name}</span>}</div>
        <h2><Link to={"/tendencias/" + trend.id}>{trend.title}</Link></h2>
        <p className={styles.summary}>{trend.narrative}</p>
      </div>
      <dl className={styles.facts}>
        <div><dt>Señales</dt><dd>{trend.metrics.signalCount}</dd></div>
        <div><dt>Actores</dt><dd>{trend.metrics.actorCount}</dd></div>
        <div><dt>Primera evidencia</dt><dd>{formatPublicDate(trend.firstSignalDate)}</dd></div>
      </dl>
    </article>
  );
}
