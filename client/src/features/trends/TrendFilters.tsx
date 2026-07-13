import { useState, type FormEvent, type SyntheticEvent } from "react";
import { TREND_SORT_OPTIONS, trendFiltersFromForm } from "./trend-filters";
import type { TrendFilterCatalogs, TrendListQuery } from "./types";
import styles from "@/features/surveillance/Surveillance.module.css";

interface Props { catalogs?: TrendFilterCatalogs; filters: TrendListQuery; onApply: (value: URLSearchParams) => void; onClear: () => void; }
export function TrendFilters({ catalogs, filters, onApply, onClear }: Props) {
  const [open, setOpen] = useState(() => typeof window.matchMedia !== "function" || !window.matchMedia("(max-width: 42rem)").matches);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onApply(trendFiltersFromForm(new FormData(event.currentTarget))); };
  return (
    <details className={styles.filters} onToggle={(event: SyntheticEvent<HTMLDetailsElement>) => setOpen(event.currentTarget.open)} open={open}>
      <summary>Filtros y orden</summary>
      <form className={styles.filterForm} key={JSON.stringify(filters)} onSubmit={submit}>
        <div className={styles.search}><label htmlFor="trend-search">Buscar</label><input defaultValue={filters.search} id="trend-search" maxLength={200} minLength={2} name="search" placeholder="Código, título o narrativa" type="search" /></div>
        <div><label htmlFor="trend-direction">Dirección</label><select defaultValue={filters.direction ?? ""} id="trend-direction" name="direction"><option value="">Todas</option>{catalogs?.directions.map((item) => item.code && <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>
        <div><label htmlFor="trend-maturity">Madurez</label><select defaultValue={filters.maturity ?? ""} id="trend-maturity" name="maturity"><option value="">Todas</option>{catalogs?.maturities.map((item) => item.code && <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>
        <div><label htmlFor="trend-sort">Ordenar</label><select defaultValue={filters.sort} id="trend-sort" name="sort">{TREND_SORT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        <div className={styles.actions}><button type="submit">Aplicar filtros</button><button onClick={onClear} type="button">Limpiar</button></div>
      </form>
    </details>
  );
}
