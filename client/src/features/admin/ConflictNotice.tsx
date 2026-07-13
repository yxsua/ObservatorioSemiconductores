import styles from "./AdminWorkspace.module.css";

export function ConflictNotice({ onReload }: { onReload: () => void }) {
  return <div className={styles.conflict} role="alert"><div><strong>Este registro cambió en otra sesión.</strong><p>No se sobrescribió información. Recarga el detalle para trabajar con la versión más reciente.</p></div><button onClick={onReload} type="button">Recargar registro</button></div>;
}
