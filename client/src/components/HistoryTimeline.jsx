function HistoryTimeline({ items = [], emptyMessage = "Sin historial" }) {
  if (items.length === 0) {
    return <p className="history-empty">{emptyMessage}</p>;
  }

  return (
    <ol className="history-timeline">
      {items.map((item, index) => (
        <li className="history-item" key={item.id ?? index}>
          <strong>{item.title ?? item.status ?? item.event}</strong>
          {item.description && <p>{item.description}</p>}
          <small>
            {[item.user, item.date].filter(Boolean).join(" - ")}
          </small>
        </li>
      ))}
    </ol>
  );
}

export default HistoryTimeline;
