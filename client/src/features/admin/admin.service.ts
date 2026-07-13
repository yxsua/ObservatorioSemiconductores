import { apiRequest } from "@/api";
import type { AdminDetailResponse, AdminEntityKind, AdminHistoryResponse, AdminListFilters, AdminListResponse } from "./types";

export function listAdminEntities(kind: AdminEntityKind, filters: AdminListFilters, token: string, signal?: AbortSignal) {
  return apiRequest<AdminListResponse>(`/admin/${kind}`, { query: filters, signal, token });
}

export function getAdminEntity(kind: AdminEntityKind, id: number, token: string, signal?: AbortSignal) {
  return apiRequest<AdminDetailResponse>(`/admin/${kind}/${id}`, { signal, token });
}

export function getAdminHistory(kind: AdminEntityKind, id: number, token: string, signal?: AbortSignal) {
  return apiRequest<AdminHistoryResponse>(`/admin/${kind}/${id}/history`, { signal, token });
}

export function transitionAdminEntity(kind: AdminEntityKind, id: number, transition: string, notes: string | null, token: string) {
  return apiRequest<AdminDetailResponse>(`/admin/${kind}/${id}/transitions`, { method: "POST", body: { transition, notes }, token });
}
