import { useId, useState, type PropsWithChildren, type ReactNode } from "react";
import styles from "./FieldHelp.module.css";

export function FieldHelp({ children, label = "Más información sobre este campo" }: PropsWithChildren<{ label?: string }>) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <span className={`${styles.help} ${open ? styles.helpOpen : ""}`}>
    <button aria-controls={id} aria-expanded={open} aria-label={label} className={styles.trigger} onClick={() => setOpen((value) => !value)} title={label} type="button">i</button>
    {open && <span className={styles.popover} id={id} role="note">{children}</span>}
  </span>;
}

export function FieldLabel({ children, help, htmlFor }: { children: ReactNode; help: ReactNode; htmlFor: string }) {
  return <span className={styles.labelRow}><label htmlFor={htmlFor}>{children}</label><FieldHelp label={`Ayuda para ${String(children)}`}>{help}</FieldHelp></span>;
}
