import { apiRequest } from "@/api";
import { getCatalogOptions } from "@/features/catalogs/catalogs.service";
import type { Alert, AlertFilterCatalogs, AlertListQuery, AlertResponse, PaginatedAlertsResponse } from "./types";

export async function listPublicAlerts(query: AlertListQuery, signal?: AbortSignal) {
  return (await apiRequest<PaginatedAlertsResponse>("/alerts", { query, signal })).data;
}
export async function getPublicAlert(id: number, signal?: AbortSignal): Promise<Alert> {
  return (await apiRequest<AlertResponse>("/alerts/" + id, { signal })).data;
}
export async function getAlertFilterCatalogs(signal?: AbortSignal): Promise<AlertFilterCatalogs> {
  const [categories, levels, audiences] = await Promise.all([
    getCatalogOptions("categories", signal),
    getCatalogOptions("alert-levels", signal),
    getCatalogOptions("audiences", signal)
  ]);
  return { categories, levels, audiences };
}
