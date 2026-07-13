const statusMap = {
  NEW: "neutral",
  DRAFT: "neutral",
  UNDER_REVIEW: "warning",
  VALIDATED: "success",
  APPROVED: "success",
  ACTIVE: "success",
  PUBLISHED: "success",
  LINKED_TO_TREND: "info",
  ESCALATED_TO_ALERT: "danger",
  CLOSED: "muted",
  ARCHIVED: "muted",
};

function StatusBadge({ value, label }) {
  const normalizedValue = String(value ?? "").toUpperCase();
  const tone = statusMap[normalizedValue] ?? "neutral";

  return (
    <span className={`status-badge status-badge--${tone}`}>
      {label ?? value ?? "Sin estado"}
    </span>
  );
}

export default StatusBadge;
