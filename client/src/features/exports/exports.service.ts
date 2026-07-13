import { apiDownload, apiRequest, type QueryParams } from "@/api";
import type { ExportFormat, ExportHistoryResponse, ExportResource } from "./types";

export function downloadPublicExport(resource: ExportResource, format: ExportFormat, filters: QueryParams, token: string) {
  return apiDownload(`/exports/${resource}.${format}`, `observatorio-${resource}.${format}`, { query: filters, token });
}

export function listOwnExportHistory(page: number, pageSize: number, token: string, signal?: AbortSignal) {
  return apiRequest<ExportHistoryResponse>("/exports/history", { query: { page, pageSize }, signal, token });
}
