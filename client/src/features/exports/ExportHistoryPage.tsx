import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageFeedback } from "@/components/feedback/PageFeedback";
import { useAuth } from "@/features/auth/AuthContext";
import { PublicPagination } from "@/features/surveillance/PublicPagination";
import { listOwnExportHistory } from "./exports.service";
import type { ExportHistoryEntry, ExportResource } from "./types";
import styles from "./Exports.module.css";

const LABELS: Record<ExportResource, string> = { signals: "Señales", trends: "Tendencias", alerts: "Alertas", content: "Contenido" };
const PAGE_SIZE = 10;

function pageFrom(params: URLSearchParams) {
  const value = Number(params.get("page"));
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Fecha no disponible" : new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatBytes(value: number) {
  const unit = value < 1024 * 1024 ? "kilobyte" : "megabyte";
  const divisor = unit === "kilobyte" ? 1024 : 1024 * 1024;
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1, style: "unit", unit, unitDisplay: "short" }).format(value / divisor);
}

function FilterSummary({ entry }: { entry: ExportHistoryEntry }) {
  const filters = Object.entries(entry.filters);
  if (!filters.length) return <span>Sin filtros</span>;
  return <details className={styles.filterDetails}><summary>{filters.length} {filters.length === 1 ? "filtro" : "filtros"}</summary><dl>{filters.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></details>;
}

export function ExportHistoryPage() {
  const auth = useAuth();
  const [params, setParams] = useSearchParams();
  const serialized = params.toString();
  const page = useMemo(() => pageFrom(new URLSearchParams(serialized)), [serialized]);
  const query = useQuery({
    queryKey: ["export-history", page],
    queryFn: ({ signal }) => listOwnExportHistory(page, PAGE_SIZE, auth.token!, signal),
    enabled: Boolean(auth.token),
    placeholderData: keepPreviousData
  });
  const changePage = (nextPage: number) => { const next = new URLSearchParams(); if (nextPage > 1) next.set("page", String(nextPage)); setParams(next); document.getElementById("history-title")?.focus(); };

  return (
    <section className={styles.historyPage} aria-labelledby="history-title">
      <nav aria-label="Ruta de navegación" className={styles.breadcrumbs}><Link to="/cuenta">Mi cuenta</Link><span aria-hidden="true">/</span><span aria-current="page">Exportaciones</span></nav>
      <header className={styles.historyHeader}><p>Actividad de la cuenta</p><h1 id="history-title" tabIndex={-1}>Historial de exportaciones</h1><span>Cada descarga exitosa registra sus metadatos; los archivos no se almacenan.</span></header>
      {query.isPending && <PageFeedback message="Estamos consultando tus exportaciones." title="Cargando historial" />}
      {query.isError && <PageFeedback actionLabel="Reintentar" message="No fue posible consultar tu historial de exportaciones." onAction={() => void query.refetch()} title="No pudimos cargar el historial" />}
      {query.data && query.data.data.items.length === 0 && <div className={styles.empty}><h2>Todavía no hay exportaciones</h2><p>Exporta una colección pública en CSV o JSON y aparecerá aquí.</p><Link to="/senales">Explorar señales</Link></div>}
      {query.data && query.data.data.items.length > 0 && <>
        <div aria-label="Historial de exportaciones" className={styles.tableRegion} role="region" tabIndex={0}>
          <table><caption>Exportaciones realizadas por tu cuenta</caption><thead><tr><th>Fecha</th><th>Colección</th><th>Formato</th><th>Registros</th><th>Tamaño</th><th>Filtros</th><th>Integridad</th></tr></thead><tbody>{query.data.data.items.map((entry) => <tr key={entry.id}><td>{formatDate(entry.createdAt)}</td><td>{LABELS[entry.resource as ExportResource] ?? entry.resource}</td><td><span className={styles.format}>{entry.format.toLocaleUpperCase("es-MX")}</span></td><td>{entry.rowCount.toLocaleString("es-MX")}</td><td>{formatBytes(entry.sizeBytes)}</td><td><FilterSummary entry={entry} /></td><td><details className={styles.checksum}><summary>Ver checksum</summary><code>{entry.checksum}</code></details></td></tr>)}</tbody></table>
        </div>
        <PublicPagination label="exportaciones" pagination={query.data.data.pagination} onPageChange={changePage} />
      </>}
    </section>
  );
}
