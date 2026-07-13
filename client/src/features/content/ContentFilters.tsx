import { useState, type FormEvent, type SyntheticEvent } from "react";
import { CONTENT_SORT_OPTIONS, contentFiltersFromForm } from "./content-filters";
import type { ContentFilterCatalogs, PublicContentListQuery } from "./types";
import styles from "./Content.module.css";

interface Props {
  catalogs?: ContentFilterCatalogs;
  filters: PublicContentListQuery;
  lockedType?: string;
  onApply: (params: URLSearchParams) => void;
  onClear: () => void;
}

export function ContentFilters({ catalogs, filters, lockedType, onApply, onClear }: Props) {
  const [open, setOpen] = useState(() => typeof window.matchMedia !== "function" || !window.matchMedia("(max-width: 42rem)").matches);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply(contentFiltersFromForm(new FormData(event.currentTarget)));
  };
  return (
    <details className={styles.filters} onToggle={(event: SyntheticEvent<HTMLDetailsElement>) => setOpen(event.currentTarget.open)} open={open}>
      <summary>Filtros y orden</summary>
      <form className={styles.filterForm} key={JSON.stringify(filters)} onSubmit={submit}>
        <div className={styles.search}><label htmlFor="content-search">Buscar</label><input defaultValue={filters.search} id="content-search" maxLength={200} minLength={2} name="search" placeholder="Título, resumen o identificador" type="search" /></div>
        {!lockedType && <div><label htmlFor="content-type">Tipo</label><select defaultValue={filters.type ?? ""} id="content-type" name="type"><option value="">Todos</option>{catalogs?.types.map((item) => item.code && <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>}
        <div><label htmlFor="content-category">Categoría</label><select defaultValue={filters.categoryId ?? ""} id="content-category" name="categoryId"><option value="">Todas</option>{catalogs?.categories.map((item) => item.id && <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        <div><label htmlFor="content-fcv">Factor crítico</label><select defaultValue={filters.fcv ?? ""} id="content-fcv" name="fcv"><option value="">Todos</option>{catalogs?.fcv.map((item) => item.code && <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>
        <div><label htmlFor="content-from">Desde</label><input defaultValue={filters.from} id="content-from" name="from" type="date" /></div>
        <div><label htmlFor="content-to">Hasta</label><input defaultValue={filters.to} id="content-to" min={filters.from} name="to" type="date" /></div>
        <div><label htmlFor="content-sort">Ordenar</label><select defaultValue={filters.sort} id="content-sort" name="sort">{CONTENT_SORT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        <div className={styles.actions}><button type="submit">Aplicar filtros</button><button onClick={onClear} type="button">Limpiar</button></div>
      </form>
    </details>
  );
}
