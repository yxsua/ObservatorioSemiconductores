import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { isApiError } from "@/api";
import { PageFeedback } from "@/components/feedback/PageFeedback";
import { formatPublicDate } from "@/features/surveillance/format";
import { ViewCounter } from "@/features/views/ViewCounter";
import { EditorialSection } from "./EditorialSection";
import { getPublicContent } from "./content.service";
import styles from "./Editorial.module.css";

interface Props { slug?: string; }

function collectionFor(type: string) {
  if (type === "NEWS") return { href: "/noticias", label: "Noticias" };
  if (type === "NEWSLETTER") return { href: "/boletines", label: "Boletines" };
  if (type === "REPORT") return { href: "/publicaciones", label: "Publicaciones" };
  return { href: "/contenido", label: "Contenido" };
}

export function ContentDetailPage({ slug: fixedSlug }: Props) {
  const routeSlug = useParams().slug;
  const slug = fixedSlug ?? routeSlug ?? "";
  const valid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 250;
  const query = useQuery({ queryKey: ["public-content-detail", slug], queryFn: ({ signal }) => getPublicContent(slug, signal), enabled: valid });
  useEffect(() => { if (query.data) document.title = query.data.title + " | Observatorio de Semiconductores"; }, [query.data]);
  if (!valid) return <PageFeedback message="La dirección no corresponde a una publicación válida." title="Publicación no encontrada"><Link to="/contenido">Volver al contenido</Link></PageFeedback>;
  if (query.isPending) return <PageFeedback message="Estamos preparando la publicación." title="Cargando publicación" />;
  if (query.isError) {
    const missing = isApiError(query.error) && query.error.status === 404;
    return <PageFeedback actionLabel={missing ? undefined : "Reintentar"} message={missing ? "La publicación no existe o ya no está disponible." : "No fue posible consultar esta publicación."} onAction={missing ? undefined : () => void query.refetch()} title={missing ? "Publicación no encontrada" : "No pudimos cargar la publicación"}><Link to="/contenido">Volver al contenido</Link></PageFeedback>;
  }
  const content = query.data;
  const collection = collectionFor(content.type.code);
  return (
    <article className={styles.page}>
      <nav aria-label="Ruta de navegación" className={styles.breadcrumbs}><Link to="/">Inicio</Link><span aria-hidden="true">/</span><Link to={collection.href}>{collection.label}</Link><span aria-hidden="true">/</span><span aria-current="page">{content.title}</span></nav>
      <header className={styles.header}>
        <div className={styles.meta}><span>{content.type.name}</span><time dateTime={content.publishedAt}>{formatPublicDate(content.publishedAt)}</time><ViewCounter id={content.id} resource="content" /></div>
        <h1>{content.title}</h1>
        {content.summary && <p>{content.summary}</p>}
        {content.categories.length > 0 && <ul aria-label="Clasificación de la publicación" className={styles.categories}>{content.categories.map((category) => <li key={category.id}>{category.name}<span>{category.fcv.name}</span></li>)}</ul>}
      </header>
      <div className={styles.document}>
        {content.sections.length > 0
          ? content.sections.map((section) => <EditorialSection key={section.id} section={section} />)
          : <div className={styles.noSections}><h2>Contenido no disponible</h2><p>La publicación no tiene secciones públicas que puedan mostrarse.</p></div>}
      </div>
      <footer className={styles.pageFooter}><Link to={collection.href}>← Volver a {collection.label.toLocaleLowerCase("es-MX")}</Link></footer>
    </article>
  );
}
