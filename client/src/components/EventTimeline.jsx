import { formatDate } from "../utils/formatters";
import ToneBullet from "./ToneBullet";

function EventTimeline({ items = [] }) {
  return (
    <section className="timeline-panel">
      <div className="section-heading">
        <p className="eyebrow">Linea del tiempo</p>
        <h2>Eventos importantes</h2>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          Aun no hay eventos, publicaciones, alertas o senales registradas.
        </div>
      ) : (
        <ol className="event-timeline">
          {items.map((item) => (
            <li key={item.id}>
              <article className={`timeline-card timeline-card--${item.tone}`}>
                <div className="timeline-card__date">
                  {formatDate(item.date)}
                </div>
                <h3>{item.title}</h3>
                {item.description && <p>{item.description}</p>}
                <ToneBullet label={item.tag || item.kind} tone={item.tone} />
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default EventTimeline;
