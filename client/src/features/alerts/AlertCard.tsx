import { Link } from "react-router-dom";
import { formatPublicDate } from "@/features/surveillance/format";
import type { Alert } from "./types";
import styles from "@/features/surveillance/Surveillance.module.css";

export function AlertCard({ alert }: { alert: Alert }) {
  const levelClass = alert.level ? styles[alert.level.code.toLowerCase()] : "";
  return (
    <article className={styles.card}>
      <div className={styles.meta}>{alert.level && <span className={styles.badge + " " + levelClass}>Nivel {alert.level.name}</span>}<span>{alert.businessCode}</span><span>{alert.status.name}</span></div>
      <div className={styles.cardBody}><p className={styles.badges}>{alert.origin.name}</p><h2><Link to={"/alertas/" + alert.id}>{alert.title}</Link></h2><p className={styles.summary}>{alert.executiveSummary}</p></div>
      <dl className={styles.facts}><div><dt>Generada</dt><dd>{formatPublicDate(alert.generationDate)}</dd></div><div><dt>Señales</dt><dd>{alert.metrics.signalCount}</dd></div><div><dt>Audiencias</dt><dd>{alert.metrics.audienceCount}</dd></div></dl>
    </article>
  );
}
