import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PageFeedback } from "@/components/feedback/PageFeedback";
import { PublicPagination } from "@/features/surveillance/PublicPagination";
import { ExportActions } from "@/features/exports/ExportActions";
import { ContentCard } from "./ContentCard";
import { ContentFilters } from "./ContentFilters";
import { countActiveContentFilters, parseContentFilters } from "./content-filters";
import { getContentFilterCatalogs, listPublicContent } from "./content.service";
import styles from "./Content.module.css";

interface Props {
  description?: string;
  eyebrow?: string;
  lockedType?: string;
  title?: string;
}

export function ContentIndexPage({
  description = "Explora publicaciones, noticias, boletines e informes producidos por el observatorio.",
  eyebrow = "Conocimiento publicado",
  lockedType,
  title = "Contenido del observatorio"
}: Props) {
  const [params, setParams] = useSearchParams();
  const serialized = params.toString();
  const filters = useMemo(() => parseContentFilters(new URLSearchParams(serialized), lockedType), [serialized, lockedType]);
  const active = countActiveContentFilters(filters, lockedType);
  const query = useQuery({
    queryKey: ["public-content", filters],
    queryFn: ({ signal }) => listPublicContent(filters, signal),
    placeholderData: keepPreviousData
  });
  const catalogs = useQuery({
    queryKey: ["content-filter-catalogs"],
    queryFn: ({ signal }) => getContentFilterCatalogs(signal),
    staleTime: 600000
  });
  const changePage = (page: number) => {
    const next = new URLSearchParams(params);
    if (page <= 1) next.delete("page"); else next.set("page", String(page));
    setParams(next);
    document.getElementById("content-results")?.scrollIntoView();
  };
  return (
    <div className={styles.page}>
      <header className={styles.header}><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{description}</p></header>
      <ContentFilters catalogs={catalogs.data} filters={filters} lockedType={lockedType} onApply={setParams} onClear={() => setParams({})} />
      {catalogs.isError && <p className={styles.notice} role="status">Algunos catálogos no están disponibles; todavía puedes buscar, ordenar y filtrar por fecha.</p>}
      <ExportActions filters={filters} resource="content" />
      <section aria-labelledby="content-results-title" className={styles.results} id="content-results">
        <div className={styles.resultsHeader}><div><h2 id="content-results-title">Publicaciones</h2>{active > 0 && <span>{active} {active === 1 ? "filtro activo" : "filtros activos"}</span>}</div>{query.data && <p aria-live="polite">{query.data.pagination.totalItems} {query.data.pagination.totalItems === 1 ? "resultado" : "resultados"}</p>}</div>
        {query.isPending && <div aria-label="Cargando contenido" className={styles.loading} role="status">{[1, 2, 3].map((item) => <span key={item} />)}</div>}
        {query.isError && <PageFeedback actionLabel="Reintentar" message="No fue posible consultar el contenido publicado." onAction={() => void query.refetch()} title="No pudimos cargar las publicaciones" />}
        {query.data && query.data.items.length === 0 && <div className={styles.empty}><h3>No encontramos publicaciones</h3><p>{active > 0 ? "Prueba una búsqueda más amplia o elimina algunos filtros." : "Aún no hay contenido publicado disponible en esta colección."}</p>{active > 0 && <button onClick={() => setParams({})}>Limpiar filtros</button>}</div>}
        {query.data && query.data.items.length > 0 && <><div className={styles.grid + (query.isPlaceholderData ? " " + styles.updating : "")}>{query.data.items.map((content) => <ContentCard content={content} key={content.id} />)}</div><PublicPagination label="contenido" pagination={query.data.pagination} onPageChange={changePage} /></>}
      </section>
    </div>
  );
}
