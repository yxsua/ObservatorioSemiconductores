function DetailList({ items = [] }) {
  const visibleItems = items.filter((item) => item.value != null && item.value !== "");

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <dl className="detail-list">
      {visibleItems.map((item) => (
        <div className="detail-list-item" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.render ? item.render(item.value) : item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default DetailList;
