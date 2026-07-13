import { PageFeedback } from "@/components/feedback/PageFeedback";
import type { AdminHistoryEntry } from "./types";
import { StatusBadge } from "./StatusBadge";
import styles from "./AdminWorkspace.module.css";

function dateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Sin fecha" : new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function AdminHistory({ error, history, loading, onRetry }: { error: boolean; history?: AdminHistoryEntry[]; loading: boolean; onRetry: () => void }) {
  if (loading) return <p className={styles.inlineStatus} role="status">Cargando historial…</p>;
  if (error) return <PageFeedback actionLabel="Reintentar" message="No fue posible consultar la trazabilidad." onAction={onRetry} title="Historial no disponible" />;
  if (!history?.length) return <p className={styles.inlineStatus}>No hay transiciones registradas.</p>;
  return <ol className={styles.timeline}>{history.map((entry) => <li key={entry.id}><div className={styles.timelineLine}><StatusBadge code={entry.toStatus.code} name={entry.toStatus.name} /><time dateTime={entry.changedAt}>{dateTime(entry.changedAt)}</time></div><strong>{entry.transition.replaceAll("_", " ")}</strong><p>{entry.fromStatus ? `De ${entry.fromStatus.name} a ${entry.toStatus.name}` : `Creación en ${entry.toStatus.name}`}</p><span>Por {entry.changedBy.name}</span>{entry.notes && <blockquote>{entry.notes}</blockquote>}</li>)}</ol>;
}
