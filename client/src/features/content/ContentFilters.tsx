import { useTaxonomyFilters } from "@/features/catalogs/useTaxonomyFilters";
import { type FormEvent } from "react";
import { CONTENT_SORT_OPTIONS, contentFiltersFromForm } from "./content-filters";
import type { ContentFilterCatalogs, PublicContentListQuery } from "./types";
import styles from "./Content.module.css";

interface Props { catalogs?: ContentFilterCatalogs; filters: PublicContentListQuery; lockedType?: string; onApply: (params: URLSearchParams) => void; onClear: () => void; }
function ContentFilterForm({ catalogs, filters, lockedType, onApply, onClear }: Props) {
  const taxonomy = useTaxonomyFilters(filters, catalogs);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onApply(contentFiltersFromForm(new FormData(event.currentTarget))); };
  return <section aria-labelledby="content-filters-title" className={styles.filters}><h2 id="content-filters-title">Filtrar publicaciones</h2><form className={styles.filterForm} key={JSON.stringify(filters)} onSubmit={submit}>
    <div className={styles.search}><label htmlFor="content-search">Buscar</label><input defaultValue={filters.search} id="content-search" maxLength={200} minLength={2} name="search" placeholder="Nombre, título o palabra clave" type="search" /></div>
    {taxonomy.factor}
    <div><label htmlFor="content-from">Desde</label><input defaultValue={filters.from} id="content-from" name="from" type="date" /></div><div><label htmlFor="content-to">Hasta</label><input defaultValue={filters.to} id="content-to" min={filters.from} name="to" type="date" /></div>
    <details className={styles.advancedFilters}><summary>Filtros avanzados</summary><div className={styles.advancedGrid}>{!lockedType && <div><label htmlFor="content-type">Tipo</label><select defaultValue={filters.type ?? ""} id="content-type" name="type"><option value="">Todos</option>{catalogs?.types.map((item) => item.code && <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>}{taxonomy.category}<div><label htmlFor="content-sort">Ordenar</label><select defaultValue={filters.sort} id="content-sort" name="sort">{CONTENT_SORT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></div></details>
    <div className={styles.actions}><button type="submit">Aplicar filtros</button><button onClick={onClear} type="button">Limpiar</button></div>
  </form></section>;
}

export function ContentFilters(props: Props) {
  return <ContentFilterForm key={JSON.stringify(props.filters)} {...props} />;
}
