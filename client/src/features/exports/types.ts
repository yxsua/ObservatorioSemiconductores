import type { components, paths } from "@/api/schema";

export type ExportResource = "signals" | "trends" | "alerts" | "content";
export type ExportFormat = "csv" | "json";
export type ExportHistoryEntry = components["schemas"]["ExportHistoryEntry"];
export type ExportHistoryResponse = paths["/exports/history"]["get"]["responses"]["200"]["content"]["application/json"];
