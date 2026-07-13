import { apiRequest } from "@/api";
import { getCatalogOptions } from "@/features/catalogs/catalogs.service";
import type {
  PaginatedSignalsResponse,
  Signal,
  SignalFilterCatalogs,
  SignalListQuery,
  SignalResponse
} from "./types";

export async function listPublicSignals(query: SignalListQuery, signal?: AbortSignal) {
  const response = await apiRequest<PaginatedSignalsResponse>("/signals", { query, signal });
  return response.data;
}

export async function getPublicSignal(id: number, signal?: AbortSignal): Promise<Signal> {
  const response = await apiRequest<SignalResponse>("/signals/" + id, { signal });
  return response.data;
}

export async function getSignalFilterCatalogs(signal?: AbortSignal): Promise<SignalFilterCatalogs> {
  const [categories, fcv, scopes] = await Promise.all([
    getCatalogOptions("categories", signal),
    getCatalogOptions("fcv", signal),
    getCatalogOptions("scopes", signal)
  ]);
  return { categories, fcv, scopes };
}
