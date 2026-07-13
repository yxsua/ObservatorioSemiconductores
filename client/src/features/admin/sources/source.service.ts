import { apiRequest } from "@/api";
import type { Source, SourceInput } from "./source.types";

interface SourceResponse { success: true; message: string; data: Source }
interface SourcesResponse { success: true; message: string; data: Source[] }
interface CatalogResponse { success: true; message: string; data: { items: Array<{ code: string; name: string }> } }

export const listSources = (token: string, signal?: AbortSignal) =>
  apiRequest<SourcesResponse>("/admin/sources", { query: { active: "all" }, signal, token });
export const getSource = (id: number, token: string, signal?: AbortSignal) =>
  apiRequest<SourceResponse>(`/admin/sources/${id}`, { signal, token });
export const getSourceTypes = (signal?: AbortSignal) =>
  apiRequest<CatalogResponse>("/catalogs/source-types", { signal });
export const createSource = (input: SourceInput, token: string) =>
  apiRequest<SourceResponse>("/admin/sources", { method: "POST", body: input, token });
export const updateSource = (id: number, input: SourceInput & { updatedAt: string }, token: string) =>
  apiRequest<SourceResponse>(`/admin/sources/${id}`, { method: "PATCH", body: input, token });
export const deactivateSource = (source: Source, token: string) =>
  apiRequest<SourceResponse>(`/admin/sources/${source.id}/deactivate`, { method: "POST", body: { updatedAt: source.updatedAt }, token });
