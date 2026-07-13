import { Link } from "react-router-dom";
import { formatPublicDate } from "@/features/surveillance/format";
import type { PublicContentSummary } from "./types";
import styles from "./Content.module.css";

export function ContentCard({ content }: { content: PublicContentSummary }) {
  const image = content.featuredMedia?.mimeType?.startsWith("image/") ? content.featuredMedia : null;
  return (
    <article className={styles.card}>
      {image ? (
        <div className={styles.media}>
          <img alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} src={"/api/media/" + image.id} />
        </div>
      ) : <div aria-hidden="true" className={styles.mediaFallback}><span>{content.type.name}</span></div>}
      <div className={styles.cardContent}>
        <div className={styles.meta}><span className={styles.type}>{content.type.name}</span><time dateTime={content.publishedAt}>{formatPublicDate(content.publishedAt)}</time></div>
        <h2><Link to={"/contenido/" + content.slug}>{content.title}</Link></h2>
        <p>{content.summary || "Consulta esta publicación del Observatorio de Semiconductores."}</p>
        {content.categories.length > 0 && <ul className={styles.tags} aria-label="Clasificación">{content.categories.slice(0, 3).map((category) => <li key={category.id}>{category.name}</li>)}</ul>}
        <Link className={styles.readMore} to={"/contenido/" + content.slug}>Consultar publicación <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}
