import { useState } from "react";
import type { TransitionOption } from "./types";
import styles from "./AdminWorkspace.module.css";

interface Props {
  busy: boolean;
  error: string | null;
  onConfirm: (option: TransitionOption, notes: string | null) => void;
  options: TransitionOption[];
}

export function TransitionPanel({ busy, error, onConfirm, options }: Props) {
  const [selected, setSelected] = useState<TransitionOption | null>(null);
  const [notes, setNotes] = useState("");
  if (!options.length) return <p className={styles.inlineStatus}>No hay transiciones disponibles para tu cuenta en este estado.</p>;
  return <>
    <div className={styles.transitions}>{options.map((option) => <button className={option.tone === "danger" ? styles.dangerAction : ""} key={option.code} onClick={() => { setSelected(option); setNotes(""); }} type="button">{option.label}</button>)}</div>
    {selected && <div className={styles.modalBackdrop} role="presentation"><section aria-labelledby="transition-title" aria-modal="true" className={styles.dialog} onKeyDown={(event) => { if (event.key === "Escape" && !busy) setSelected(null); }} role="alertdialog"><h3 id="transition-title">Confirmar: {selected.label}</h3><p>{selected.description}</p><label htmlFor="transition-notes">Notas de la transición <span>(opcional)</span></label><textarea autoFocus id="transition-notes" maxLength={2000} onChange={(event) => setNotes(event.target.value)} rows={4} value={notes} />{error && <p className={styles.actionError} role="alert">{error}</p>}<div className={styles.dialogActions}><button disabled={busy} onClick={() => setSelected(null)} type="button">Cancelar</button><button className={selected.tone === "danger" ? styles.dangerAction : styles.primaryAction} disabled={busy} onClick={() => onConfirm(selected, notes.trim() || null)} type="button">{busy ? "Procesando…" : `Confirmar ${selected.label.toLocaleLowerCase("es-MX")}`}</button></div></section></div>}
  </>;
}
