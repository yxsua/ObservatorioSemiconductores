import { Link } from "react-router-dom";
import type { AdminEntityConfig } from "./admin-config";
import type { AdminEntityView } from "./types";
import { StatusBadge } from "./StatusBadge";
import styles from "./AdminWorkspace.module.css";

function dateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Sin fecha" : new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function AdminTable({ config, entities, search }: { config: AdminEntityConfig; entities: AdminEntityView[]; search: string }) {
  return (
    <div aria-label={`Listado interno de ${config.plural.toLocaleLowerCase("es-MX")}`} className={styles.tableRegion} role="region" tabIndex={0}>
      <table><caption>{config.plural} disponibles en el flujo interno</caption><thead><tr><th>Código</th><th>Título</th><th>Estado</th><th>Responsable</th><th>Actualización</th><th><span className={styles.srOnly}>Acciones</span></th></tr></thead><tbody>{entities.map((entity) => (
        <tr key={entity.id}><td><code>{entity.businessCode}</code></td><td>{entity.title}</td><td><StatusBadge {...entity.status} /></td><td>{entity.owner ?? "Sin asignar"}</td><td>{dateTime(entity.updatedAt)}</td><td><Link aria-label={`Abrir ${config.singular}: ${entity.title}`} to={{ pathname: `/admin/${config.route}/${entity.id}`, search }}>Abrir →</Link></td></tr>
      ))}</tbody></table>
    </div>
  );
}
