import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PageFeedback } from "@/components/feedback/PageFeedback";
import { useAuth } from "@/features/auth/AuthContext";
import { deactivateSource, listSources } from "./source.service";
import styles from "../AdminWorkspace.module.css";

export function SourcesPage() {
  const auth = useAuth(); const queryClient = useQueryClient();
  const rawId = Number(useParams().id); const selectedId = Number.isSafeInteger(rawId) && rawId > 0 ? rawId : null;
  const query = useQuery({ queryKey: ["sources"], queryFn: ({ signal }) => listSources(auth.token!, signal) });
  const selected = query.data?.data.find((source) => source.id === selectedId);
  const deactivate = useMutation({ mutationFn: () => deactivateSource(selected!, auth.token!), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sources"] }) });
  if (query.isPending) return <PageFeedback title="Cargando fuentes" message="Consultando el registro institucional de fuentes." />;
  if (query.isError) return <PageFeedback title="Fuentes no disponibles" message="No fue posible consultar las fuentes." actionLabel="Reintentar" onAction={() => void query.refetch()} />;
  return <section className={styles.page}><header className={styles.pageHeader}><div><p>Catálogo interno</p><h1>Fuentes</h1><span>Administra los orígenes utilizados por señales, tendencias y productos editoriales.</span></div>{auth.hasPermission("sources:create") && <Link className={styles.headerAction} to="/admin/fuentes/nueva">Nueva fuente</Link>}</header>
    <div className={selectedId ? styles.workspaceWithPanel : styles.workspace}><div className={styles.listPane}><div className={styles.resultsHeader}><h2>Registros</h2><p>{query.data.data.length} resultados</p></div>
      {query.data.data.length === 0 ? <div className={styles.empty}><h3>Sin fuentes</h3><p>Registra la primera fuente para habilitar la captura de señales.</p></div> : <table><thead><tr><th>Fuente</th><th>Tipo</th><th>País</th><th>Estado</th></tr></thead><tbody>{query.data.data.map((source)=><tr key={source.id}><td><Link to={`/admin/fuentes/${source.id}`}>{source.name}</Link></td><td>{source.type.name}</td><td>{source.country ?? "—"}</td><td>{source.active ? "Activa" : "Inactiva"}</td></tr>)}</tbody></table>}
    </div>{selectedId && <aside className={styles.panelPane}>{!selected ? <PageFeedback title="Fuente no disponible" message="No existe en el listado actual." /> : <div className={styles.listPane}><h2>{selected.name}</h2><p>{selected.type.name} · {selected.country ?? "Sin país"}</p><dl><dt>Sitio web</dt><dd>{selected.website ? <a href={selected.website} rel="noreferrer" target="_blank">{selected.website}</a> : "—"}</dd><dt>RSS</dt><dd>{selected.rssUrl ?? "—"}</dd><dt>API</dt><dd>{selected.apiUrl ?? "—"}</dd><dt>Confiabilidad histórica</dt><dd>{selected.historicalReliability ?? "Sin evaluar"}</dd><dt>Estado</dt><dd>{selected.active ? "Activa" : "Inactiva"}</dd></dl><div className={styles.resultsHeader}>{selected.active && auth.hasPermission("sources:update") && <Link to={`/admin/fuentes/${selected.id}/editar`}>Editar</Link>}{selected.active && auth.hasPermission("sources:deactivate") && <Button disabled={deactivate.isPending} onClick={() => deactivate.mutate()} variant="danger">Desactivar</Button>}</div>{deactivate.isError && <p role="alert">No fue posible desactivar; recarga la versión actual.</p>}</div>}</aside>}</div>
  </section>;
}
