import { apiRequest } from "@/api";
import type { components } from "@/api/schema";
import type { AdminDetailResponse } from "../types";
import type { TrendFormOptions } from "./trend-form.types";

type CreateInput = components["schemas"]["CreateTrendInput"];
type UpdateInput = components["schemas"]["UpdateTrendInput"];
interface CatalogResponse { success: true; data: { items: Array<{ code: string; name: string }> } }
interface SignalResponse { success: true; data: { items: Array<{ id: number; businessCode: string; title: string }> } }
interface ActorResponse { success: true; data: Array<{ id: number; name: string; type: { name: string } | null }> }

const options = (items: Array<{code:string;name:string}>) => items.map((item) => ({ value: item.code, label: item.name }));
export async function getTrendFormOptions(token: string, signal?: AbortSignal): Promise<TrendFormOptions> {
  const [directions, maturities, signals, actors] = await Promise.all([
    apiRequest<CatalogResponse>("/catalogs/trend-directions", { signal }),
    apiRequest<CatalogResponse>("/catalogs/trend-maturity", { signal }),
    apiRequest<SignalResponse>("/admin/signals", { query: { page: 1, pageSize: 100, status: "VALIDATED", sort: "-publicationDate" }, signal, token }),
    apiRequest<ActorResponse>("/admin/actors", { signal, token })
  ]);
  return { directions: options(directions.data.items), maturities: options(maturities.data.items), signals: signals.data.items.map((item) => ({ value: String(item.id), label: `${item.businessCode} · ${item.title}` })), actors: actors.data.map((item) => ({ value: String(item.id), label: item.type ? `${item.name} · ${item.type.name}` : item.name })) };
}
export const createTrend = (input: CreateInput, token: string) => apiRequest<AdminDetailResponse>("/admin/trends", { method: "POST", body: input, token });
export const updateTrend = (id: number, input: UpdateInput, token: string) => apiRequest<AdminDetailResponse>(`/admin/trends/${id}`, { method: "PATCH", body: input, token });
export const linkTrendRelations = (id: number, relation: "signals" | "actors", ids: number[], token: string) => ids.length ? apiRequest<AdminDetailResponse>(`/admin/trends/${id}/${relation}`, { method: "POST", body: { ids }, token }) : Promise.resolve(null);
export const unlinkTrendRelation = (id: number, relation: "signals" | "actors", relationId: number, token: string) => apiRequest<AdminDetailResponse>(`/admin/trends/${id}/${relation}/${relationId}`, { method: "DELETE", token });
