import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./TaxonomyFilter.module.css";

interface Option { value: string; name: string }
interface Props {
  label: string;
  name: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  loading?: boolean;
}

export function TaxonomyFilter({ label, name, options, selected, onChange, loading }: Props) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);
  const close = () => { dialog.current?.close(); setOpen(false); trigger.current?.focus(); };
  return <div className={styles.field}>
    <span className={styles.label}>{label}</span>
    <button ref={trigger} type="button" aria-haspopup="dialog" disabled={loading} onClick={() => setOpen(true)}>Seleccionar {label.toLocaleLowerCase("es")} ({selected.length})</button>
    {selected.length ? <ul className={styles.tags} aria-label={`${label}: selecci\u00f3n actual`}>{selected.map(value => <li key={value}>{options.find(option => option.value === value)?.name ?? value}</li>)}</ul> : <small>Sin restricción</small>}
    {selected.map(value => <input key={value} type="hidden" name={name} value={value} />)}
    {open && createPortal(<dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close(); }}>
      <header><h2 id={titleId}>{label}</h2><button type="button" onClick={close} aria-label={`Cerrar ${label.toLocaleLowerCase("es")}`}>Cerrar</button></header>
      <div className={styles.options}><p>Selecciona una o varias opciones. Sin selección se incluyen todas las opciones disponibles.</p>
        {options.map(option => <label key={option.value}><input type="checkbox" checked={selected.includes(option.value)} onChange={() => onChange(selected.includes(option.value) ? selected.filter(value => value !== option.value) : [...selected, option.value])} />{option.name}</label>)}
        {!options.length && <p>No hay opciones disponibles para los factores elegidos.</p>}
      </div>
      <footer><span>{selected.length} seleccionados</span><button type="button" onClick={() => onChange([])}>Quitar selección</button><button type="button" onClick={close}>Listo</button></footer>
    </dialog>, document.body)}
  </div>;
}

