import styles from "./AdminWorkspace.module.css";

export function StatusBadge({ code, name }: { code: string; name: string }) {
  return <span className={styles.status} data-status={code}>{name}</span>;
}
