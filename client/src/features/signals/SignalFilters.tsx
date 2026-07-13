import { useState, type FormEvent, type SyntheticEvent } from "react";
import type { SignalFilterCatalogs, SignalListQuery } from "./types";
import {
  SIGNAL_LEVEL_OPTIONS,
  SIGNAL_SORT_OPTIONS,
  signalFiltersFromForm
} from "./signal-filters";
import styles from "./Signals.module.css";

interface SignalFiltersProps {
  catalogs?: SignalFilterCatalogs;
  filters: SignalListQuery;
  onApply: (params: URLSearchParams) => void;
  onClear: () => void;
}

export function SignalFilters({ catalogs, filters, onApply, onClear }: SignalFiltersProps) {
  const [open, setOpen] = useState(() => (
    typeof window.matchMedia !== "function"
      || !window.matchMedia("(max-width: 42rem)").matches
  ));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply(signalFiltersFromForm(new FormData(event.currentTarget)));
  };

  return (
    <details
      className={styles.filters}
      onToggle={(event: SyntheticEvent<HTMLDetailsElement>) => setOpen(event.currentTarget.open)}
      open={open}
    >
      <summary>Filtros y orden</summary>
      <form className={styles.filtersForm} key={JSON.stringify(filters)} onSubmit={submit}>
        <div className={styles.searchField}>
          <label htmlFor="signal-search">Buscar</label>
          <input
            defaultValue={filters.search}
            id="signal-search"
            maxLength={200}
            minLength={2}
            name="search"
            placeholder="Código, título o resumen"
            type="search"
          />
        </div>
        <div>
          <label htmlFor="signal-category">Categoría</label>
          <select defaultValue={filters.categoryId ?? ""} id="signal-category" name="categoryId">
            <option value="">Todas</option>
            {catalogs?.categories.map((option) => option.id && (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="signal-fcv">Factor crítico</label>
          <select defaultValue={filters.fcv ?? ""} id="signal-fcv" name="fcv">
            <option value="">Todos</option>
            {catalogs?.fcv.map((option) => option.code && (
              <option key={option.code} value={option.code}>{option.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="signal-impact">Impacto</label>
          <select defaultValue={filters.impact ?? ""} id="signal-impact" name="impact">
            <option value="">Todos</option>
            {SIGNAL_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="signal-urgency">Urgencia</label>
          <select defaultValue={filters.urgency ?? ""} id="signal-urgency" name="urgency">
            <option value="">Todas</option>
            {SIGNAL_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="signal-reliability">Confiabilidad</label>
          <select defaultValue={filters.reliability ?? ""} id="signal-reliability" name="reliability">
            <option value="">Todas</option>
            {SIGNAL_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="signal-scope">Alcance</label>
          <select defaultValue={filters.scope ?? ""} id="signal-scope" name="scope">
            <option value="">Todos</option>
            {catalogs?.scopes.map((option) => option.code && (
              <option key={option.code} value={option.code}>{option.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="signal-from">Desde</label>
          <input defaultValue={filters.from} id="signal-from" name="from" type="date" />
        </div>
        <div>
          <label htmlFor="signal-to">Hasta</label>
          <input defaultValue={filters.to} id="signal-to" name="to" type="date" />
        </div>
        <div>
          <label htmlFor="signal-sort">Ordenar</label>
          <select defaultValue={filters.sort} id="signal-sort" name="sort">
            {SIGNAL_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.filterActions}>
          <button className={styles.applyButton} type="submit">Aplicar filtros</button>
          <button className={styles.clearButton} onClick={onClear} type="button">Limpiar</button>
        </div>
      </form>
    </details>
  );
}
