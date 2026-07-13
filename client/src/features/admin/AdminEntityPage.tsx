import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useParams, useSearchParams } from "react-router-dom";
import { isApiError } from "@/api";
import { PageFeedback } from "@/components/feedback/PageFeedback";
import { useAuth } from "@/features/auth/AuthContext";
import { PublicPagination } from "@/features/surveillance/PublicPagination";
import { ADMIN_CONFIG } from "./admin-config";
import { parseAdminFilters } from "./admin-filters";
import { getAdminEntity, getAdminHistory, listAdminEntities, transitionAdminEntity } from "./admin.service";
import { toAdminEntityView } from "./admin-view";
import { AdminDetailPanel } from "./AdminDetailPanel";
import { AdminFilters } from "./AdminFilters";
import { AdminTable } from "./AdminTable";
import type { AdminEntityKind, TransitionOption } from "./types";
import { transitionsFor } from "./admin-config";
import styles from "./AdminWorkspace.module.css";

export function AdminEntityPage({ kind }: { kind: AdminEntityKind }) {
  const config = ADMIN_CONFIG[kind];
  const auth = useAuth();
  const queryClient = useQueryClient();
  const routeId = useParams().id;
  const selectedId = routeId && /^\d+$/.test(routeId) && Number(routeId) > 0 ? Number(routeId) : null;
  const [params, setParams] = useSearchParams();
  const serialized = params.toString();
  const filters = useMemo(() => parseAdminFilters(kind, new URLSearchParams(serialized)), [kind, serialized]);
  const [conflict, setConflict] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [transitionResetKey, setTransitionResetKey] = useState(0);
  const list = useQuery({ queryKey: ["admin-entities", kind, filters], queryFn: ({ signal }) => listAdminEntities(kind, filters, auth.token!, signal), enabled: Boolean(auth.token), placeholderData: keepPreviousData });
  const detail = useQuery({ queryKey: ["admin-entity", kind, selectedId], queryFn: ({ signal }) => getAdminEntity(kind, selectedId!, auth.token!, signal), enabled: Boolean(auth.token && selectedId) });
  const history = useQuery({ queryKey: ["admin-history", kind, selectedId], queryFn: ({ signal }) => getAdminHistory(kind, selectedId!, auth.token!, signal), enabled: Boolean(auth.token && selectedId) });
  const mutation = useMutation({ mutationFn: ({ option, notes }: { option: TransitionOption; notes: string | null }) => transitionAdminEntity(kind, selectedId!, option.code, notes, auth.token!), onSuccess: async () => { setConflict(false); setTransitionError(null); setTransitionResetKey((value) => value + 1); await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-entities", kind] }), queryClient.invalidateQueries({ queryKey: ["admin-entity", kind, selectedId] }), queryClient.invalidateQueries({ queryKey: ["admin-history", kind, selectedId] })]); }, onError: (error) => { if (isApiError(error) && error.status === 409) { setConflict(true); setTransitionError("El registro cambió en otra sesión. Cancela esta confirmación y recarga la versión actual."); return; } setTransitionError(isApiError(error) ? error.message : "No fue posible ejecutar la transición."); } });
  const search = serialized ? `?${serialized}` : "";
  const changePage = (page: number) => { const next = new URLSearchParams(params); if (page <= 1) next.delete("page"); else next.set("page", String(page)); setParams(next); document.getElementById("admin-results-title")?.focus(); };
  const reload = async () => { setConflict(false); setTransitionError(null); await Promise.all([detail.refetch(), history.refetch(), list.refetch()]); };
  const selectedView = detail.data ? toAdminEntityView(kind, detail.data.data) : null;
  const selectedSignal = kind === "signals" && detail.data ? detail.data.data : null;
  const ownsSelectedSignal = selectedSignal && "analyst" in selectedSignal && selectedSignal.analyst?.id === auth.user?.id;
  const editSignalHref = selectedSignal && selectedSignal.status.code === "NEW" && (auth.hasPermission("signals:update-any") || (auth.hasPermission("signals:update-own") && ownsSelectedSignal)) ? `/admin/senales/${selectedSignal.id}/editar` : undefined;
  const selectedTrend = kind === "trends" && detail.data ? detail.data.data : null;
  const trendAnalyst = selectedTrend && "analyst" in selectedTrend ? selectedTrend.analyst as { id?: number } | null | undefined : null;
  const editTrendHref = selectedTrend && selectedTrend.status.code === "NEW" && auth.hasPermission("trends:update") && (trendAnalyst?.id === auth.user?.id || auth.hasPermission("trends:validate")) ? `/admin/tendencias/${selectedTrend.id}/editar` : undefined;
  const selectedAlert = kind === "alerts" && detail.data ? detail.data.data : null;
  const alertCreator = selectedAlert && "creator" in selectedAlert ? selectedAlert.creator as { id?: number } | null | undefined : null;
  const editAlertHref = selectedAlert && selectedAlert.status.code === "NEW" && auth.hasPermission("alerts:update") && (alertCreator?.id === auth.user?.id || auth.hasPermission("alerts:validate")) ? `/admin/alertas/${selectedAlert.id}/editar` : undefined;
  const allowedTransitions = selectedView ? transitionsFor(kind, selectedView.status.code).filter((option) => auth.hasPermission(option.permission)) : [];

  return <section className={styles.page} aria-labelledby="admin-page-title">
    <header className={styles.pageHeader}><div><p>Flujo interno</p><h1 id="admin-page-title">{config.plural}</h1><span>Consulta, filtra y revisa la trazabilidad antes de actuar sobre cada registro.</span></div>{kind === "signals" && auth.hasPermission("signals:create") && <Link className={styles.headerAction} to="/admin/senales/nueva">Nueva señal</Link>}{kind === "trends" && auth.hasPermission("trends:create") && <Link className={styles.headerAction} to="/admin/tendencias/nueva">Nueva tendencia</Link>}{kind === "alerts" && auth.hasPermission("alerts:create") && <Link className={styles.headerAction} to="/admin/alertas/nueva">Nueva alerta</Link>}</header>
    <AdminFilters config={config} filters={filters} onApply={setParams} onClear={() => setParams({})} />
    <div className={selectedId ? styles.workspaceWithPanel : styles.workspace}>
      <div className={styles.listPane}>
        <div className={styles.resultsHeader}><div><h2 id="admin-results-title" tabIndex={-1}>Registros</h2>{(filters.search || filters.status) && <span>Vista filtrada</span>}</div>{list.data && <p aria-live="polite">{list.data.data.pagination.totalItems} resultados</p>}</div>
        {list.isPending && <div aria-label={`Cargando ${config.plural.toLocaleLowerCase("es-MX")}`} className={styles.loading} role="status"><span /><span /><span /></div>}
        {list.isError && <PageFeedback actionLabel="Reintentar" message={`No fue posible consultar ${config.plural.toLocaleLowerCase("es-MX")}.`} onAction={() => void list.refetch()} title="No pudimos cargar los registros" />}
        {list.data && list.data.data.items.length === 0 && <div className={styles.empty}><h3>Sin registros</h3><p>{filters.search || filters.status ? "Cambia o elimina los filtros para ampliar la consulta." : `Todavía no hay ${config.plural.toLocaleLowerCase("es-MX")} en el flujo interno.`}</p></div>}
        {list.data && list.data.data.items.length > 0 && <><AdminTable config={config} entities={list.data.data.items.map((entity) => toAdminEntityView(kind, entity))} search={search} /><PublicPagination label={config.plural.toLocaleLowerCase("es-MX")} pagination={list.data.data.pagination} onPageChange={changePage} /></>}
      </div>
      {selectedId && <div className={styles.panelPane}>{detail.isPending && <PageFeedback message="Estamos consultando el registro y su versión actual." title="Cargando detalle" />}{detail.isError && <PageFeedback actionLabel="Reintentar" message="El registro no existe o ya no está disponible para tu cuenta." onAction={() => void detail.refetch()} title="Detalle no disponible" />}{selectedView && <AdminDetailPanel config={config} conflict={conflict} editHref={editSignalHref ?? editTrendHref ?? editAlertHref} entity={selectedView} history={history.data?.data} historyError={history.isError} historyLoading={history.isPending} onConfirmTransition={(option, notes) => mutation.mutate({ option, notes })} onReload={() => void reload()} onRetryHistory={() => void history.refetch()} search={search} transitionBusy={mutation.isPending} transitionError={transitionError} transitionResetKey={transitionResetKey} transitions={allowedTransitions} />}</div>}
    </div>
  </section>;
}

export const SignalsAdminPage = () => <AdminEntityPage kind="signals" />;
export const TrendsAdminPage = () => <AdminEntityPage kind="trends" />;
export const AlertsAdminPage = () => <AdminEntityPage kind="alerts" />;
