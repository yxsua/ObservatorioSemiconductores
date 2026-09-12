import type { PublicContentListQuery, PublicContentSort } from "./types";

export const CONTENT_SORT_OPTIONS: ReadonlyArray<{ value: PublicContentSort; label: string }> = [
  { value: "-publishedAt", label: "Más recientes" },
  { value: "publishedAt", label: "Más antiguos" },
  { value: "title", label: "Título A–Z" },
  { value: "-title", label: "Título Z–A" }
];
const sorts = new Set<string>(CONTENT_SORT_OPTIONS.map(({ value }) => value));
const positive = (value: string | null) => {
  const number = Number(value);
  return value && Number.isSafeInteger(number) && number > 0 ? number : undefined;
};
const search = (value: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length >= 2 && normalized.length <= 200 ? normalized : undefined;
};
const code = (value: string | null) => value?.trim() ? value.trim().toUpperCase() : undefined;
const date = (value: string | null) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(value + "T12:00:00Z");
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value ? undefined : value;
};

export function parseContentFilters(params: URLSearchParams, lockedType?: string): PublicContentListQuery {
  const sort = params.get("sort");
  const from = date(params.get("from"));
  const toCandidate = date(params.get("to"));
  const to = from && toCandidate && from > toCandidate ? undefined : toCandidate;
  return {
    page: positive(params.get("page")) ?? 1,
    pageSize: 12,
    search: search(params.get("search")),
    type: lockedType ?? code(params.get("type")),
    fcvCodes: params.get("fcvCodes") || undefined,
    categoryIds: params.get("categoryIds") || undefined,
    categoryId: positive(params.get("categoryId")),
    fcv: code(params.get("fcv")),
    from,
    to,
    sort: sort && sorts.has(sort) ? sort as PublicContentSort : "-publishedAt"
  };
}

export function contentFiltersFromForm(form: FormData) {
  const params = new URLSearchParams();
  for (const key of ["search", "type", "categoryId", "fcv", "from", "to", "sort"]) {
    const value = form.get(key);
    if (typeof value === "string" && value.trim()) params.set(key, value.trim());
  }
  for (const key of ["fcvCodes", "categoryIds"]) {
    const values = [...new Set(form.getAll(key).map(String).filter(Boolean))];
    if (values.length) params.set(key, values.join(","));
  }
  return params;
}

export function countActiveContentFilters(filters: PublicContentListQuery, lockedType?: string) {
  return [
    filters.search,
    lockedType ? undefined : filters.type,
    filters.categoryIds || filters.categoryId,
    filters.fcvCodes || filters.fcv,
    filters.from,
    filters.to
  ].filter(Boolean).length;
}
