import { type FormEvent } from "react";
import { ALERT_SORT_OPTIONS, ALERT_STATUS_OPTIONS, alertFiltersFromForm } from "./alert-filters";
import type { AlertFilterCatalogs, AlertListQuery } from "./types";
import styles from "@/features/surveillance/Surveillance.module.css";

interface Props { catalogs?: AlertFilterCatalogs; filters: AlertListQuery; onApply: (value: URLSearchParams) => void; onClear: () => void; }
export function AlertFilters({ catalogs, filters, onApply, onClear }: Props) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onApply(alertFiltersFromForm(new FormData(event.currentTarget))); };
  return <section aria-labelledby="alert-filters-title" className={styles.filters}><h2 id="alert-filters-title">Filtrar alertas</h2><form className={styles.filterForm} key={JSON.stringify(filters)} onSubmit={submit}>
    <div className={styles.search}><label htmlFor="alert-search">Buscar</label><input defaultValue={filters.search} id="alert-search" maxLength={200} minLength={2} name="search" placeholder="Nombre, código o palabra clave" type="search" /></div>
    <div><label htmlFor="alert-category">Categoría</label><select defaultValue={filters.categoryId ?? ""} id="alert-category" name="categoryId"><option value="">Todas</option>{catalogs?.categories.map((item) => item.id && <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
    <div><label htmlFor="alert-from">Desde</label><input defaultValue={filters.from} id="alert-from" name="from" type="date" /></div><div><label htmlFor="alert-to">Hasta</label><input defaultValue={filters.to} id="alert-to" min={filters.from} name="to" type="date" /></div>
    <details className={styles.advancedFilters}><summary>Filtros avanzados</summary><div className={styles.advancedGrid}><div><label htmlFor="alert-status">Estado</label><select defaultValue={filters.status ?? ""} id="alert-status" name="status"><option value="">Todos</option>{ALERT_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><div><label htmlFor="alert-level">Nivel</label><select defaultValue={filters.level ?? ""} id="alert-level" name="level"><option value="">Todos</option>{catalogs?.levels.map((item) => item.code && <option key={item.code} value={item.code}>{item.name}</option>)}</select></div><div><label htmlFor="alert-audience">Audiencia</label><select defaultValue={filters.audience ?? ""} id="alert-audience" name="audience"><option value="">Todas</option>{catalogs?.audiences.map((item) => item.code && <option key={item.code} value={item.code}>{item.name}</option>)}</select></div><div><label htmlFor="alert-sort">Ordenar</label><select defaultValue={filters.sort} id="alert-sort" name="sort">{ALERT_SORT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></div></details>
    <div className={styles.actions}><button type="submit">Aplicar filtros</button><button onClick={onClear} type="button">Limpiar</button></div>
  </form></section>;
}
