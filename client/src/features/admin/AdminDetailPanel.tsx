import { Link } from "react-router-dom";
import type { AdminEntityConfig } from "./admin-config";
import type { AdminEntityView, AdminHistoryEntry, TransitionOption } from "./types";
import { AdminHistory } from "./AdminHistory";
import { ConflictNotice } from "./ConflictNotice";
import { StatusBadge } from "./StatusBadge";
import { TransitionPanel } from "./TransitionPanel";
import styles from "./AdminWorkspace.module.css";
import {AssessmentField} from '@/features/assessment/AssessmentField';

interface Props {
  config: AdminEntityConfig;
  conflict: boolean;
  entity: AdminEntityView;
  editHref?: string;
  history?: AdminHistoryEntry[];
  historyError: boolean;
  historyLoading: boolean;
  onConfirmTransition: (option: TransitionOption, notes: string | null) => void;
  onReload: () => void;
  onRetryHistory: () => void;
  search: string;
  transitionBusy: boolean;
  transitionError: string | null;
  transitionResetKey: number;
  transitions: TransitionOption[];
}

export function AdminDetailPanel(props: Props) {
  const { config, conflict, editHref, entity, history, historyError, historyLoading, onConfirmTransition, onReload, onRetryHistory, search, transitionBusy, transitionError, transitionResetKey, transitions } = props;
  return <aside aria-label={`Detalle de ${config.singular}: ${entity.title}`} className={styles.detailPanel}>
    <div className={styles.detailToolbar}><div><Link to={{ pathname: `/admin/${config.route}`, search }}>← Cerrar detalle</Link>{editHref && <Link to={editHref}>Editar</Link>}</div><code>{entity.businessCode}</code></div>
    {conflict && <ConflictNotice onReload={onReload} />}
    <header className={styles.detailHeader}><StatusBadge {...entity.status} /><h2>{entity.title}</h2><p>{entity.description}</p></header>
    <dl className={styles.facts}>{entity.facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
    {entity.assessment&&<AssessmentField kind={entity.assessment.kind} value={entity.assessment.value} onChange={()=>{}} readOnly />}
    {(entity.evidenceUrl || entity.keywords?.length || entity.internalNotes) && <section className={styles.panelSection} aria-labelledby="capture-title"><h3 id="capture-title">Evidencia y contexto</h3>{entity.evidenceUrl && <a href={entity.evidenceUrl} rel="noreferrer" target="_blank">Abrir evidencia ↗</a>}{entity.keywords && entity.keywords.length > 0 && <div className={styles.keywords} aria-label="Palabras clave">{entity.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>}{entity.internalNotes && <div className={styles.internalNotes}><strong>Notas internas</strong><p>{entity.internalNotes}</p></div>}</section>}
    {entity.requirements && <section className={styles.panelSection} aria-labelledby="requirements-title"><h3 id="requirements-title">Preparación para revisión</h3><ul>{entity.requirements.map((item) => <li key={item.label}>{item.ready ? "✓" : "○"} {item.label}</li>)}</ul></section>}
    <section className={styles.panelSection} aria-labelledby="actions-title"><h3 id="actions-title">Acciones de estado</h3><TransitionPanel busy={transitionBusy} error={transitionError} key={transitionResetKey} onConfirm={onConfirmTransition} options={transitions} /></section>
    <section className={styles.panelSection} aria-labelledby="history-title"><h3 id="history-title">Historial</h3><AdminHistory error={historyError} history={history} loading={historyLoading} onRetry={onRetryHistory} /></section>
  </aside>;
}
