import { type FormEvent } from "react";
import { TREND_SORT_OPTIONS, trendFiltersFromForm } from "./trend-filters";
import type { TrendFilterCatalogs, TrendListQuery } from "./types";
import styles from "@/features/surveillance/Surveillance.module.css";

interface Props { catalogs?: TrendFilterCatalogs; filters: TrendListQuery; onApply: (value: URLSearchParams) => void; onClear: () => void; }
export function TrendFilters({ catalogs, filters, onApply, onClear }: Props) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onApply(trendFiltersFromForm(new FormData(event.currentTarget))); };
  return <section aria-labelledby="trend-filters-title" className={styles.filters}><h2 id="trend-filters-title">Filtrar tendencias</h2><form className={styles.filterForm} key={JSON.stringify(filters)} onSubmit={submit}>
    <div className={styles.search}><label htmlFor="trend-search">Buscar</label><input defaultValue={filters.search} id="trend-search" maxLength={200} minLength={2} name="search" placeholder="Nombre, código o palabra clave" type="search" /></div>
    <div><label htmlFor="trend-category">Categoría</label><select defaultValue={filters.categoryId ?? ""} id="trend-category" name="categoryId"><option value="">Todas</option>{catalogs?.categories.map((item) => item.id && <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
    <div><label htmlFor="trend-from">Desde</label><input defaultValue={filters.from} id="trend-from" name="from" type="date" /></div><div><label htmlFor="trend-to">Hasta</label><input defaultValue={filters.to} id="trend-to" min={filters.from} name="to" type="date" /></div>
    <details className={styles.advancedFilters}><summary>Filtros avanzados</summary><div className={styles.advancedGrid}><div><label htmlFor="trend-direction">Dirección</label><select defaultValue={filters.direction ?? ""} id="trend-direction" name="direction"><option value="">Todas</option>{catalogs?.directions.map((item) => item.code && <option key={item.code} value={item.code}>{item.name}</option>)}</select></div><div><label htmlFor="trend-maturity">Madurez</label><select defaultValue={filters.maturity ?? ""} id="trend-maturity" name="maturity"><option value="">Todas</option>{catalogs?.maturities.map((item) => item.code && <option key={item.code} value={item.code}>{item.name}</option>)}</select></div><div><label htmlFor="trend-sort">Ordenar</label><select defaultValue={filters.sort} id="trend-sort" name="sort">{TREND_SORT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></div></details>
    <div className={styles.actions}><button type="submit">Aplicar filtros</button><button onClick={onClear} type="button">Limpiar</button></div>
  </form></section>;
}
