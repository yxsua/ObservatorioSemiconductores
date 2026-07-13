import { formatNumber } from "../utils/formatters";

function MetricCard({ label, value, detail, tone = "neutral" }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}

export default MetricCard;
