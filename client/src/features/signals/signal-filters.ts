import type { SignalLevel, SignalListQuery, SignalSort } from "./types";

export const DEFAULT_SIGNAL_PAGE_SIZE = 12;

export const SIGNAL_SORT_OPTIONS: ReadonlyArray<{ value: SignalSort; label: string }> = [
  { value: "-publicationDate", label: "Más recientes" },
  { value: "publicationDate", label: "Más antiguas" },
  { value: "-ips", label: "Mayor prioridad (IPS)" },
  { value: "ips", label: "Menor prioridad (IPS)" },
  { value: "title", label: "Título A–Z" },
  { value: "-title", label: "Título Z–A" }
];

export const SIGNAL_LEVEL_OPTIONS: ReadonlyArray<{ value: SignalLevel; label: string }> = [
  { value: "LOW", label: "Bajo" },
  { value: "MEDIUM", label: "Medio" },
  { value: "HIGH", label: "Alto" }
];

const validSorts = new Set<string>(SIGNAL_SORT_OPTIONS.map((option) => option.value));
const validLevels = new Set<string>(SIGNAL_LEVEL_OPTIONS.map((option) => option.value));

function positiveInteger(value: string | null) {
  if (!value) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : undefined;
}

function boundedSearch(value: string | null) {
  const normalized = value?.trim();
  return normalized && normalized.length >= 2 && normalized.length <= 200
    ? normalized
    : undefined;
}

function code(value: string | null) {
  return value?.trim() ? value.trim().toUpperCase() : undefined;
}

function level(value: string | null) {
  const normalized = code(value);
  return normalized && validLevels.has(normalized)
    ? normalized as SignalLevel
    : undefined;
}

function date(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

export function parseSignalFilters(params: URLSearchParams): SignalListQuery {
  const sort = params.get("sort");
  return {
    page: positiveInteger(params.get("page")) ?? 1,
    pageSize: DEFAULT_SIGNAL_PAGE_SIZE,
    fcvCodes: params.get("fcvCodes") || undefined,
    categoryIds: params.get("categoryIds") || undefined,
    search: boundedSearch(params.get("search")),
    categoryId: positiveInteger(params.get("categoryId")),
    fcv: code(params.get("fcv")),
    impact: level(params.get("impact")),
    urgency: level(params.get("urgency")),
    reliability: level(params.get("reliability")),
    from: date(params.get("from")),
    to: date(params.get("to")),
    sort: sort && validSorts.has(sort) ? sort as SignalSort : "-publicationDate"
  };
}

export function signalFiltersFromForm(form: FormData) {
  const params = new URLSearchParams();
  for (const key of [
    "search", "categoryId", "fcv", "impact", "urgency",
    "reliability", "from", "to", "sort"
  ]) {
    const value = form.get(key);
    if (typeof value === "string" && value.trim()) params.set(key, value.trim());
  }
  for (const key of ["fcvCodes", "categoryIds"]) {
    const values = [...new Set(form.getAll(key).map(String).filter(Boolean))];
    if (values.length) params.set(key, values.join(","));
  }
  return params;
}

export function countActiveSignalFilters(filters: SignalListQuery) {
  return [
    filters.search,
    filters.categoryIds || filters.categoryId,
    filters.fcvCodes || filters.fcv,
    filters.impact,
    filters.urgency,
    filters.reliability,
    filters.from,
    filters.to
  ].filter(Boolean).length;
}
