import type { components } from "@/api/schema";
import type { Pagination, QueryParams } from "@/api";

export type AdminEntityKind = "signals" | "trends" | "alerts";
export type AdminEntity = components["schemas"]["Signal"] | components["schemas"]["Trend"] | components["schemas"]["Alert"];
export type AdminHistoryEntry = components["schemas"]["SignalHistoryEntry"];

export interface AdminListResponse {
  success: true;
  message: string;
  data: { items: AdminEntity[]; pagination: Pagination };
}

export interface AdminDetailResponse {
  success: true;
  message: string;
  data: AdminEntity;
}

export interface AdminHistoryResponse {
  success: true;
  message: string;
  data: AdminHistoryEntry[];
}

export interface AdminListFilters extends QueryParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  sort?: string;
}

export interface AdminFact { label: string; value: string; }

export interface AdminEntityView {
  id: number;
  businessCode: string;
  title: string;
  description: string;
  status: { code: string; name: string };
  updatedAt: string;
  owner: string | null;
  facts: AdminFact[];
  evidenceUrl?: string;
  keywords?: string[];
  internalNotes?: string | null;
  requirements?: Array<{ label: string; ready: boolean }>;
}

export interface TransitionOption {
  code: string;
  label: string;
  description: string;
  permission: string;
  tone?: "danger" | "primary";
}
