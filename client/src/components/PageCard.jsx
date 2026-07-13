import { Link } from "react-router-dom";

function PageCard({ title, description, tag, to }) {
  return (
    <article className="page-card">
      {tag && <span className="page-card__tag">{tag}</span>}
      <h2>{title}</h2>
      <p>{description}</p>

      {to && (
        <Link className="page-card__link" to={to}>
          Abrir
        </Link>
      )}
    </article>
  );
}

export default PageCard;
