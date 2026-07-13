import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageFeedback } from "@/components/feedback/PageFeedback";
import { ExportActions } from "@/features/exports/ExportActions";
import { SignalCard } from "./SignalCard";
import { SignalFilters } from "./SignalFilters";
import { SignalPagination } from "./SignalPagination";
import {
  countActiveSignalFilters,
  parseSignalFilters
} from "./signal-filters";
import {
  getSignalFilterCatalogs,
  listPublicSignals
} from "./signals.service";
import styles from "./Signals.module.css";

export function SignalsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const serializedParams = searchParams.toString();
  const filters = useMemo(
    () => parseSignalFilters(new URLSearchParams(serializedParams)),
    [serializedParams]
  );
  const activeFilters = countActiveSignalFilters(filters);
  const signals = useQuery({
    queryKey: ["public-signals", filters],
    queryFn: ({ signal }) => listPublicSignals(filters, signal),
    placeholderData: keepPreviousData
  });
  const catalogs = useQuery({
    queryKey: ["signal-filter-catalogs"],
    queryFn: ({ signal }) => getSignalFilterCatalogs(signal),
    staleTime: 10 * 60 * 1000
  });

  const changePage = (page: number) => {
    const next = new URLSearchParams(searchParams);
    if (page <= 1) next.delete("page"); else next.set("page", String(page));
    setSearchParams(next);
    document.getElementById("signal-results")?.scrollIntoView();
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Vigilancia tecnológica</p>
        <h1>Señales del sector</h1>
        <p>
          Acontecimientos verificados que pueden anticipar cambios tecnológicos,
          productivos, regulatorios o de mercado.
        </p>
      </header>

      <SignalFilters
        catalogs={catalogs.data}
        filters={filters}
        onApply={(params) => setSearchParams(params)}
        onClear={() => setSearchParams({})}
      />
      {catalogs.isError && (
        <p className={styles.catalogNotice} role="status">
          Algunos catálogos no están disponibles; todavía puedes buscar y ordenar.
        </p>
      )}

      <ExportActions filters={filters} resource="signals" />
      <section aria-labelledby="signal-results-title" className={styles.results} id="signal-results">
        <div className={styles.resultsHeader}>
          <div>
            <h2 id="signal-results-title">Resultados</h2>
            {activeFilters > 0 && <span>{activeFilters} {activeFilters === 1 ? "filtro activo" : "filtros activos"}</span>}
          </div>
          {signals.data && (
            <p aria-live="polite">
              {signals.data.pagination.totalItems} {signals.data.pagination.totalItems === 1 ? "señal" : "señales"}
            </p>
          )}
        </div>

        {signals.isPending && (
          <div aria-label="Cargando señales" className={styles.loadingGrid} role="status">
            {[1, 2, 3].map((item) => <span key={item} />)}
          </div>
        )}
        {signals.isError && (
          <PageFeedback
            actionLabel="Reintentar"
            message="No fue posible consultar las señales públicas."
            onAction={() => void signals.refetch()}
            title="No pudimos cargar las señales"
          />
        )}
        {signals.data && signals.data.items.length === 0 && (
          <div className={styles.empty}>
            <h3>No encontramos señales</h3>
            <p>{activeFilters > 0
              ? "Prueba una búsqueda más amplia o elimina algunos filtros."
              : "Aún no hay señales validadas disponibles para consulta pública."
            }</p>
            {activeFilters > 0 && <button onClick={() => setSearchParams({})}>Limpiar filtros</button>}
          </div>
        )}
        {signals.data && signals.data.items.length > 0 && (
          <>
            <div className={`${styles.cardGrid} ${signals.isPlaceholderData ? styles.updating : ""}`}>
              {signals.data.items.map((signal) => <SignalCard key={signal.id} signal={signal} />)}
            </div>
            <SignalPagination pagination={signals.data.pagination} onPageChange={changePage} />
          </>
        )}
      </section>

      <aside className={styles.methodNote}>
        <strong>¿Cómo se construye una señal?</strong>
        <p>El IPS, la prioridad y el estado son calculados o validados por el proceso metodológico del observatorio.</p>
        <Link to="/vigilancia">Conocer la vigilancia tecnológica</Link>
      </aside>
    </div>
  );
}
