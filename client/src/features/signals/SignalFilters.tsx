import { type FormEvent } from "react";
import type { SignalFilterCatalogs, SignalListQuery } from "./types";
import { SIGNAL_LEVEL_OPTIONS, SIGNAL_SORT_OPTIONS, signalFiltersFromForm } from "./signal-filters";
import styles from "./Signals.module.css";

interface Props { catalogs?: SignalFilterCatalogs; filters: SignalListQuery; onApply: (params: URLSearchParams) => void; onClear: () => void; }

export function SignalFilters({ catalogs, filters, onApply, onClear }: Props) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onApply(signalFiltersFromForm(new FormData(event.currentTarget))); };
  return <section aria-labelledby="signal-filters-title" className={styles.filters}>
    <h2 id="signal-filters-title">Filtrar señales</h2>
    <form className={styles.filtersForm} key={JSON.stringify(filters)} onSubmit={submit}>
      <div className={styles.searchField}><label htmlFor="signal-search">Buscar</label><input defaultValue={filters.search} id="signal-search" maxLength={200} minLength={2} name="search" placeholder="Nombre, código o palabra clave" type="search" /></div>
      <div><label htmlFor="signal-category">Categoría</label><select defaultValue={filters.categoryId ?? ""} id="signal-category" name="categoryId"><option value="">Todas</option>{catalogs?.categories.map((option) => option.id && <option key={option.id} value={option.id}>{option.name}</option>)}</select></div>
      <div><label htmlFor="signal-from">Desde</label><input defaultValue={filters.from} id="signal-from" name="from" type="date" /></div>
      <div><label htmlFor="signal-to">Hasta</label><input defaultValue={filters.to} id="signal-to" name="to" type="date" /></div>
      <details className={styles.advancedFilters}><summary>Filtros avanzados</summary><div className={styles.advancedGrid}>
        <div><label htmlFor="signal-fcv">Factor crítico</label><select defaultValue={filters.fcv ?? ""} id="signal-fcv" name="fcv"><option value="">Todos</option>{catalogs?.fcv.map((option) => option.code && <option key={option.code} value={option.code}>{option.name}</option>)}</select></div>
        {(["impact", "urgency", "reliability"] as const).map((name) => <div key={name}><label htmlFor={`signal-${name}`}>{name === "impact" ? "Impacto" : name === "urgency" ? "Urgencia" : "Confiabilidad"}</label><select defaultValue={filters[name] ?? ""} id={`signal-${name}`} name={name}><option value="">Todos</option>{SIGNAL_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>)}
        <div><label htmlFor="signal-scope">Alcance</label><select defaultValue={filters.scope ?? ""} id="signal-scope" name="scope"><option value="">Todos</option>{catalogs?.scopes.map((option) => option.code && <option key={option.code} value={option.code}>{option.name}</option>)}</select></div>
        <div><label htmlFor="signal-sort">Ordenar</label><select defaultValue={filters.sort} id="signal-sort" name="sort">{SIGNAL_SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
      </div></details>
      <div className={styles.filterActions}><button className={styles.applyButton} type="submit">Aplicar filtros</button><button className={styles.clearButton} onClick={onClear} type="button">Limpiar</button></div>
    </form>
  </section>;
}
