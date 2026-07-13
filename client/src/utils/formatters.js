export function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  const normalizedDate =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00`)
      : new Date(value);

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(normalizedDate);
}

export function formatNumber(value) {
  const parsedValue = Number(value ?? 0);

  return new Intl.NumberFormat("es-MX").format(parsedValue);
}

export function formatPercent(value) {
  if (value === null || value === undefined || value === "") {
    return "Sin dato";
  }

  const numericValue = Number(value);
  const percentValue =
    numericValue >= 0 && numericValue <= 1
      ? numericValue * 100
      : numericValue;

  return `${percentValue.toFixed(0)}%`;
}
