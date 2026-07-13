import { apiRequest } from "@/api";
import { getCatalogOptions } from "@/features/catalogs/catalogs.service";
import type { PaginatedTrendsResponse, Trend, TrendFilterCatalogs, TrendListQuery, TrendResponse } from "./types";

export async function listPublicTrends(query: TrendListQuery, signal?: AbortSignal) {
  return (await apiRequest<PaginatedTrendsResponse>("/trends", { query, signal })).data;
}
export async function getPublicTrend(id: number, signal?: AbortSignal): Promise<Trend> {
  return (await apiRequest<TrendResponse>("/trends/" + id, { signal })).data;
}
export async function getTrendFilterCatalogs(signal?: AbortSignal): Promise<TrendFilterCatalogs> {
  const [directions, maturities] = await Promise.all([
    getCatalogOptions("trend-directions", signal),
    getCatalogOptions("trend-maturity", signal)
  ]);
  return { directions, maturities };
}
