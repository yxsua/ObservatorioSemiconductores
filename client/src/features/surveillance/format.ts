export function formatPublicDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" })
    .format(new Date(value.slice(0, 10) + "T12:00:00Z"));
}

export function relationNumber(item: Record<string, unknown>, key = "id") {
  return typeof item[key] === "number" ? item[key] : null;
}

export function relationText(item: Record<string, unknown>, key: string) {
  return typeof item[key] === "string" ? item[key] : null;
}
