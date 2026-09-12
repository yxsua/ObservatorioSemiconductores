import { useTaxonomyFilters } from "@/features/catalogs/useTaxonomyFilters";
import { type FormEvent } from "react";
import type { SignalFilterCatalogs, SignalListQuery } from "./types";
import { SIGNAL_LEVEL_OPTIONS, SIGNAL_SORT_OPTIONS, signalFiltersFromForm } from "./signal-filters";
import styles from "./Signals.module.css";

interface Props { catalogs?: SignalFilterCatalogs; filters: SignalListQuery; onApply: (params: URLSearchParams) => void; onClear: () => void; }

export function SignalFilters({ catalogs, filters, onApply, onClear }: Props) {
  return <SignalFilterForm key={JSON.stringify(filters)} catalogs={catalogs} filters={filters} onApply={onApply} onClear={onClear} />;
}

function SignalFilterForm({ catalogs, filters, onApply, onClear }: Props) {
  const taxonomy = useTaxonomyFilters(filters, catalogs);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onApply(signalFiltersFromForm(new FormData(event.currentTarget))); };
  return <section aria-labelledby="signal-filters-title" className={styles.filters}>
    <h2 id="signal-filters-title">Filtrar señales</h2>
    <form className={styles.filtersForm} key={JSON.stringify(filters)} onSubmit={submit}>
      <div className={styles.searchField}><label htmlFor="signal-search">Buscar</label><input defaultValue={filters.search} id="signal-search" maxLength={200} minLength={2} name="search" placeholder="Nombre, código o palabra clave" type="search" /></div>
      {taxonomy.factor}
      <div><label htmlFor="signal-from">Desde</label><input defaultValue={filters.from} id="signal-from" name="from" type="date" /></div>
      <div><label htmlFor="signal-to">Hasta</label><input defaultValue={filters.to} id="signal-to" name="to" type="date" /></div>
      <details className={styles.advancedFilters}><summary>Filtros avanzados</summary><div className={styles.advancedGrid}>
        {taxonomy.category}
        {(["impact", "urgency", "reliability"] as const).map((name) => <div key={name}><label htmlFor={`signal-${name}`}>{name === "impact" ? "Impacto" : name === "urgency" ? "Urgencia" : "Confiabilidad"}</label><select defaultValue={filters[name] ?? ""} id={`signal-${name}`} name={name}><option value="">Todos</option>{SIGNAL_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>)}
        <div><label htmlFor="signal-sort">Ordenar</label><select defaultValue={filters.sort} id="signal-sort" name="sort">{SIGNAL_SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
      </div></details>
      <div className={styles.filterActions}><button className={styles.applyButton} type="submit">Aplicar filtros</button><button className={styles.clearButton} onClick={onClear} type="button">Limpiar</button></div>
    </form>
  </section>;
}

