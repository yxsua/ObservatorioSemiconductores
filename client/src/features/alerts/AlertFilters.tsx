import { useState, type FormEvent, type SyntheticEvent } from "react";
import { ALERT_SORT_OPTIONS, ALERT_STATUS_OPTIONS, alertFiltersFromForm } from "./alert-filters";
import type { AlertFilterCatalogs, AlertListQuery } from "./types";
import styles from "@/features/surveillance/Surveillance.module.css";

interface Props { catalogs?: AlertFilterCatalogs; filters: AlertListQuery; onApply: (value: URLSearchParams) => void; onClear: () => void; }
export function AlertFilters({ catalogs, filters, onApply, onClear }: Props) {
  const [open, setOpen] = useState(() => typeof window.matchMedia !== "function" || !window.matchMedia("(max-width: 42rem)").matches);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onApply(alertFiltersFromForm(new FormData(event.currentTarget))); };
  return (
    <details className={styles.filters} onToggle={(event: SyntheticEvent<HTMLDetailsElement>) => setOpen(event.currentTarget.open)} open={open}>
      <summary>Filtros y orden</summary>
      <form className={styles.filterForm} key={JSON.stringify(filters)} onSubmit={submit}>
        <div className={styles.search}><label htmlFor="alert-search">Buscar</label><input defaultValue={filters.search} id="alert-search" maxLength={200} minLength={2} name="search" placeholder="Código, título o resumen" type="search" /></div>
        <div><label htmlFor="alert-status">Estado</label><select defaultValue={filters.status ?? ""} id="alert-status" name="status"><option value="">Todos</option>{ALERT_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        <div><label htmlFor="alert-level">Nivel</label><select defaultValue={filters.level ?? ""} id="alert-level" name="level"><option value="">Todos</option>{catalogs?.levels.map((item) => item.code && <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>
        <div><label htmlFor="alert-audience">Audiencia</label><select defaultValue={filters.audience ?? ""} id="alert-audience" name="audience"><option value="">Todas</option>{catalogs?.audiences.map((item) => item.code && <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>
        <div><label htmlFor="alert-sort">Ordenar</label><select defaultValue={filters.sort} id="alert-sort" name="sort">{ALERT_SORT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        <div className={styles.actions}><button type="submit">Aplicar filtros</button><button onClick={onClear} type="button">Limpiar</button></div>
      </form>
    </details>
  );
}
