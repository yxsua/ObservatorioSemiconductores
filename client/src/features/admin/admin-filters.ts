import { ADMIN_CONFIG } from "./admin-config";
import type { AdminEntityKind, AdminListFilters } from "./types";

const PAGE_SIZE = 20;

function positive(value: string | null) {
  const number = Number(value);
  return value && Number.isSafeInteger(number) && number > 0 ? number : undefined;
}

export function parseAdminFilters(kind: AdminEntityKind, params: URLSearchParams): AdminListFilters {
  const config = ADMIN_CONFIG[kind];
  const rawSearch = params.get("search")?.trim();
  const rawStatus = params.get("status")?.trim().toUpperCase();
  return {
    page: positive(params.get("page")) ?? 1,
    pageSize: PAGE_SIZE,
    search: rawSearch && rawSearch.length >= 2 && rawSearch.length <= 200 ? rawSearch : undefined,
    status: rawStatus && config.statuses.some(({ code }) => code === rawStatus) ? rawStatus : undefined,
    sort: config.defaultSort
  };
}

export function adminFiltersFromForm(form: FormData) {
  const params = new URLSearchParams();
  for (const key of ["search", "status"]) {
    const value = form.get(key);
    if (typeof value === "string" && value.trim()) params.set(key, value.trim());
  }
  return params;
}
