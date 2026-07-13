import type { QueryParams } from "@/api";
import type { ExportResource } from "./types";

const ALLOWED_FILTERS: Record<ExportResource, ReadonlySet<string>> = {
  signals: new Set(["search", "categoryId", "fcv", "impact", "urgency", "reliability", "scope", "from", "to", "sort"]),
  trends: new Set(["search", "direction", "maturity", "sort"]),
  alerts: new Set(["search", "level", "audience", "sort"]),
  content: new Set(["search", "type", "categoryId", "fcv", "from", "to", "sort"])
};

export function compatibleExportFilters(resource: ExportResource, source: object): QueryParams {
  const allowed = ALLOWED_FILTERS[resource];
  return Object.fromEntries(Object.entries(source).filter(([key, value]) => (
    allowed.has(key)
    && value !== undefined
    && value !== null
    && value !== ""
    && ["string", "number", "boolean"].includes(typeof value)
  ))) as QueryParams;
}

export function countExportFilters(filters: QueryParams) {
  return Object.keys(filters).filter((key) => key !== "sort").length;
}
