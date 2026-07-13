import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PageFeedback } from "@/components/feedback/PageFeedback";
import { ExportActions } from "@/features/exports/ExportActions";
import { PublicPagination } from "@/features/surveillance/PublicPagination";
import { TrendCard } from "./TrendCard";
import { TrendFilters } from "./TrendFilters";
import { countActiveTrendFilters, parseTrendFilters } from "./trend-filters";
import { getTrendFilterCatalogs, listPublicTrends } from "./trends.service";
import styles from "@/features/surveillance/Surveillance.module.css";

export function TrendsListPage() {
  const [params, setParams] = useSearchParams();
  const serialized = params.toString();
  const filters = useMemo(() => parseTrendFilters(new URLSearchParams(serialized)), [serialized]);
  const active = countActiveTrendFilters(filters);
  const query = useQuery({ queryKey: ["public-trends", filters], queryFn: ({ signal }) => listPublicTrends(filters, signal), placeholderData: keepPreviousData });
  const catalogs = useQuery({ queryKey: ["trend-filter-catalogs"], queryFn: ({ signal }) => getTrendFilterCatalogs(signal), staleTime: 600000 });
  const changePage = (page: number) => { const next = new URLSearchParams(params); if (page <= 1) next.delete("page"); else next.set("page", String(page)); setParams(next); document.getElementById("trend-results")?.scrollIntoView(); };
  return (
    <div className={styles.page}>
      <header className={styles.header}><p className={styles.eyebrow}>Inteligencia estratégica</p><h1>Tendencias del sector</h1><p>Patrones consolidados a partir de señales verificadas, con dirección, madurez y evidencia relacionada.</p></header>
      <TrendFilters catalogs={catalogs.data} filters={filters} onApply={setParams} onClear={() => setParams({})} />
      {catalogs.isError && <p className={styles.notice} role="status">Algunos catálogos no están disponibles; todavía puedes buscar y ordenar.</p>}
      <ExportActions filters={filters} resource="trends" />
      <section className={styles.results} id="trend-results" aria-labelledby="trend-results-title">
        <div className={styles.resultsHeader}><div><h2 id="trend-results-title">Resultados</h2>{active > 0 && <span>{active} {active === 1 ? "filtro activo" : "filtros activos"}</span>}</div>{query.data && <p aria-live="polite">{query.data.pagination.totalItems} {query.data.pagination.totalItems === 1 ? "tendencia" : "tendencias"}</p>}</div>
        {query.isPending && <div aria-label="Cargando tendencias" className={styles.loading} role="status">{[1,2,3].map((item) => <span key={item} />)}</div>}
        {query.isError && <PageFeedback actionLabel="Reintentar" message="No fue posible consultar las tendencias públicas." onAction={() => void query.refetch()} title="No pudimos cargar las tendencias" />}
        {query.data && query.data.items.length === 0 && <div className={styles.empty}><h3>No encontramos tendencias</h3><p>{active ? "Prueba una búsqueda más amplia o elimina algunos filtros." : "Aún no hay tendencias activas disponibles para consulta pública."}</p>{active > 0 && <button onClick={() => setParams({})}>Limpiar filtros</button>}</div>}
        {query.data && query.data.items.length > 0 && <><div className={styles.grid + (query.isPlaceholderData ? " " + styles.updating : "")}>{query.data.items.map((trend) => <TrendCard key={trend.id} trend={trend} />)}</div><PublicPagination label="tendencias" pagination={query.data.pagination} onPageChange={changePage} /></>}
      </section>
    </div>
  );
}
