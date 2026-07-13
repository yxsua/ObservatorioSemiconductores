import { Link } from "react-router-dom";
import { formatSignalDate, signalLevelLabel } from "./signal-format";
import type { Signal } from "./types";
import styles from "./Signals.module.css";

interface SignalCardProps {
  signal: Signal;
}

export function SignalCard({ signal }: SignalCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.cardMeta}>
        <span className={`${styles.priority} ${styles[`priority${signal.priority}`]}`}>
          Prioridad {signalLevelLabel(signal.priority).toLocaleLowerCase("es-MX")}
        </span>
        <span>{signal.businessCode}</span>
      </div>
      <div className={styles.cardBody}>
        <p className={styles.cardCategory}>{signal.category.name} · {signal.category.fcv.name}</p>
        <h2><Link to={`/senales/${signal.id}`}>{signal.title}</Link></h2>
        <p className={styles.cardSummary}>{signal.summary}</p>
      </div>
      <dl className={styles.cardFacts}>
        <div><dt>IPS</dt><dd>{signal.ips}/27</dd></div>
        <div><dt>Impacto</dt><dd>{signal.impact.name}</dd></div>
        <div><dt>Publicación</dt><dd>{formatSignalDate(signal.publicationDate)}</dd></div>
      </dl>
      <Link aria-label={`Consultar señal: ${signal.title}`} className={styles.cardLink} to={`/senales/${signal.id}`}>
        Consultar señal <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
