import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PageFeedback } from "@/components/feedback/PageFeedback";
import { ExportActions } from "@/features/exports/ExportActions";
import { PublicPagination } from "@/features/surveillance/PublicPagination";
import { AlertCard } from "./AlertCard";
import { AlertFilters } from "./AlertFilters";
import { countActiveAlertFilters, parseAlertFilters } from "./alert-filters";
import { getAlertFilterCatalogs, listPublicAlerts } from "./alerts.service";
import styles from "@/features/surveillance/Surveillance.module.css";

export function AlertsListPage() {
  const [params, setParams] = useSearchParams();
  const serialized = params.toString();
  const filters = useMemo(() => parseAlertFilters(new URLSearchParams(serialized)), [serialized]);
  const active = countActiveAlertFilters(filters);
  const query = useQuery({ queryKey: ["public-alerts", filters], queryFn: ({ signal }) => listPublicAlerts(filters, signal), placeholderData: keepPreviousData });
  const catalogs = useQuery({ queryKey: ["alert-filter-catalogs"], queryFn: ({ signal }) => getAlertFilterCatalogs(signal), staleTime: 600000 });
  const changePage = (page: number) => { const next = new URLSearchParams(params); if (page <= 1) next.delete("page"); else next.set("page", String(page)); setParams(next); document.getElementById("alert-results")?.scrollIntoView(); };
  return (
    <div className={styles.page}>
      <header className={styles.header}><p className={styles.eyebrow}>Respuesta oportuna</p><h1>Alertas estratégicas</h1><p>Situaciones publicadas que requieren atención, con nivel, plazo, audiencias y evidencia que sustenta su activación.</p></header>
      <AlertFilters catalogs={catalogs.data} filters={filters} onApply={setParams} onClear={() => setParams({})} />
      {catalogs.isError && <p className={styles.notice} role="status">Algunos catálogos no están disponibles; todavía puedes buscar y ordenar.</p>}
      <ExportActions filters={filters} resource="alerts" />
      <section className={styles.results} id="alert-results" aria-labelledby="alert-results-title">
        <div className={styles.resultsHeader}><div><h2 id="alert-results-title">Resultados</h2>{active > 0 && <span>{active} {active === 1 ? "filtro activo" : "filtros activos"}</span>}</div>{query.data && <p aria-live="polite">{query.data.pagination.totalItems} {query.data.pagination.totalItems === 1 ? "alerta" : "alertas"}</p>}</div>
        {query.isPending && <div aria-label="Cargando alertas" className={styles.loading} role="status">{[1,2,3].map((item) => <span key={item} />)}</div>}
        {query.isError && <PageFeedback actionLabel="Reintentar" message="No fue posible consultar las alertas públicas." onAction={() => void query.refetch()} title="No pudimos cargar las alertas" />}
        {query.data && query.data.items.length === 0 && <div className={styles.empty}><h3>No encontramos alertas</h3><p>{active ? "Prueba una búsqueda más amplia o elimina algunos filtros." : "Aún no hay alertas publicadas o cerradas disponibles para consulta pública."}</p>{active > 0 && <button onClick={() => setParams({})}>Limpiar filtros</button>}</div>}
        {query.data && query.data.items.length > 0 && <><div className={styles.grid + (query.isPlaceholderData ? " " + styles.updating : "")}>{query.data.items.map((alert) => <AlertCard alert={alert} key={alert.id} />)}</div><PublicPagination label="alertas" pagination={query.data.pagination} onPageChange={changePage} /></>}
      </section>
    </div>
  );
}
