import type { AlertLevel, AlertListQuery, AlertSort, AlertStatus } from "./types";

export const ALERT_SORT_OPTIONS: ReadonlyArray<{ value: AlertSort; label: string }> = [
  { value: "-updatedAt", label: "Actualización más reciente" }, { value: "-generationDate", label: "Generación más reciente" }, { value: "responseDeadline", label: "Respuesta más próxima" }, { value: "-level", label: "Mayor nivel" }, { value: "title", label: "Título A–Z" }
];
export const ALERT_STATUS_OPTIONS: ReadonlyArray<{ value: AlertStatus; label: string }> = [{ value: "PUBLISHED", label: "Publicada" }, { value: "CLOSED", label: "Cerrada" }];
const sorts = new Set<string>(ALERT_SORT_OPTIONS.map(({ value }) => value)); const levels = new Set(["YELLOW", "ORANGE", "RED"]); const statuses = new Set(["PUBLISHED", "CLOSED"]);
const positive = (value: string | null) => { const n = Number(value); return value && Number.isSafeInteger(n) && n > 0 ? n : undefined; };
const search = (value: string | null) => { const v = value?.trim(); return v && v.length >= 2 && v.length <= 200 ? v : undefined; };
const code = (value: string | null) => value?.trim().toUpperCase();
const date = (value: string | null) => { if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined; const parsed = new Date(value + "T12:00:00Z"); return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value ? undefined : value; };

export function parseAlertFilters(params: URLSearchParams): AlertListQuery {
  const sort = params.get("sort"); const status = code(params.get("status")); const level = code(params.get("level")); const from = date(params.get("from")); const toCandidate = date(params.get("to"));
  return { page: positive(params.get("page")) ?? 1, pageSize: 12, search: search(params.get("search")), categoryId: positive(params.get("categoryId")), from, to: from && toCandidate && from > toCandidate ? undefined : toCandidate, status: status && statuses.has(status) ? status as AlertStatus : undefined, level: level && levels.has(level) ? level as AlertLevel : undefined, audience: code(params.get("audience")), sort: sort && sorts.has(sort) ? sort as AlertSort : "-updatedAt" };
}
export function alertFiltersFromForm(form: FormData) { const params = new URLSearchParams(); for (const key of ["search", "categoryId", "from", "to", "status", "level", "audience", "sort"]) { const value = form.get(key); if (typeof value === "string" && value.trim()) params.set(key, value.trim()); } return params; }
export function countActiveAlertFilters(filters: AlertListQuery) { return [filters.search, filters.categoryId, filters.from, filters.to, filters.status, filters.level, filters.audience].filter(Boolean).length; }
