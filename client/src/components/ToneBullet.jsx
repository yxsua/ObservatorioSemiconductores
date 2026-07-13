const codeToneMap = {
  HIGH: "danger",
  RED: "danger",
  ESCALATED_TO_ALERT: "danger",
  DISRUPTIVE: "danger",
  MEDIUM: "warning",
  ORANGE: "warning",
  UNDER_REVIEW: "warning",
  YELLOW: "notice",
  NEW: "neutral",
  LOW: "info",
  VALIDATED: "success",
  PUBLISHED: "success",
  APPROVED: "success",
  ACTIVE: "success",
  INCREASING: "success",
  LINKED_TO_TREND: "info",
  ARCHIVED: "muted",
  CLOSED: "muted",
};

export function toneFromCode(code, fallback = "neutral") {
  return codeToneMap[String(code ?? "").toUpperCase()] ?? fallback;
}

function ToneBullet({ label, tone = "neutral", value }) {
  return (
    <span className={`tone-bullet tone-bullet--${tone}`}>
      <span className="tone-bullet__dot" aria-hidden="true" />
      <span>{label}</span>
      {value !== undefined && value !== null && <strong>{value}</strong>}
    </span>
  );
}

export default ToneBullet;
