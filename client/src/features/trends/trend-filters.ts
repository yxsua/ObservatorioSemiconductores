import type { TrendListQuery, TrendSort } from "./types";

export const TREND_SORT_OPTIONS: ReadonlyArray<{ value: TrendSort; label: string }> = [
  { value: "-updatedAt", label: "Actualización más reciente" },
  { value: "-firstSignalDate", label: "Evidencia más reciente" },
  { value: "-signalCount", label: "Más señales relacionadas" },
  { value: "title", label: "Título A–Z" },
  { value: "-title", label: "Título Z–A" }
];
const sorts = new Set<string>(TREND_SORT_OPTIONS.map(({ value }) => value));
const positive = (value: string | null) => { const n = Number(value); return value && Number.isSafeInteger(n) && n > 0 ? n : undefined; };
const search = (value: string | null) => { const v = value?.trim(); return v && v.length >= 2 && v.length <= 200 ? v : undefined; };
const code = (value: string | null) => value?.trim() ? value.trim().toUpperCase() : undefined;

export function parseTrendFilters(params: URLSearchParams): TrendListQuery {
  const sort = params.get("sort");
  return { page: positive(params.get("page")) ?? 1, pageSize: 12, search: search(params.get("search")), direction: code(params.get("direction")), maturity: code(params.get("maturity")), sort: sort && sorts.has(sort) ? sort as TrendSort : "-updatedAt" };
}
export function trendFiltersFromForm(form: FormData) {
  const params = new URLSearchParams();
  for (const key of ["search", "direction", "maturity", "sort"]) { const value = form.get(key); if (typeof value === "string" && value.trim()) params.set(key, value.trim()); }
  return params;
}
export function countActiveTrendFilters(filters: TrendListQuery) { return [filters.search, filters.direction, filters.maturity].filter(Boolean).length; }
