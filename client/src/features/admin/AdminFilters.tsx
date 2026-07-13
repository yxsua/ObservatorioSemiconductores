import { adminFiltersFromForm } from "./admin-filters";
import type { AdminEntityConfig } from "./admin-config";
import type { AdminListFilters } from "./types";
import styles from "./AdminWorkspace.module.css";

interface Props {
  config: AdminEntityConfig;
  filters: AdminListFilters;
  onApply: (params: URLSearchParams) => void;
  onClear: () => void;
}

export function AdminFilters({ config, filters, onApply, onClear }: Props) {
  return (
    <form className={styles.filters} key={`${filters.search}-${filters.status}`} onSubmit={(event) => { event.preventDefault(); onApply(adminFiltersFromForm(new FormData(event.currentTarget))); }}>
      <div><label htmlFor={`${config.kind}-admin-search`}>Buscar</label><input defaultValue={filters.search ?? ""} id={`${config.kind}-admin-search`} maxLength={200} minLength={2} name="search" placeholder="Código o título" type="search" /></div>
      <div><label htmlFor={`${config.kind}-admin-status`}>Estado</label><select defaultValue={filters.status ?? ""} id={`${config.kind}-admin-status`} name="status"><option value="">Todos</option>{config.statuses.map((status) => <option key={status.code} value={status.code}>{status.name}</option>)}</select></div>
      <div className={styles.filterActions}><button type="submit">Aplicar filtros</button><button onClick={onClear} type="button">Limpiar</button></div>
    </form>
  );
}
