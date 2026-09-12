import { apiRequest } from "@/api";
import type { components } from "@/api/schema";
import type { AdminDetailResponse } from "../types";
import type { SignalInput } from "./signal-form.schema";
import type { SignalFormOption, SignalFormOptions } from "./signal-form.types";

interface CatalogResponse {
  success: true;
  message: string;
  data: { name: string; items: Record<string, unknown>[] };
}

interface SourceResponse {
  success: true;
  message: string;
  data: Array<{ id: number; name: string; type: { code: string; name: string } }>;
}

type UpdateSignalInput = Omit<components["schemas"]["UpdateSignalInput"],'impactCode'|'urgencyCode'|'reliabilityCode'|'scopeCode'> & {assessment?:SignalInput['assessment']};

const text = (item: Record<string, unknown>, key: string) => typeof item[key] === "string" ? item[key] : null;
const number = (item: Record<string, unknown>, key: string) => typeof item[key] === "number" ? item[key] : null;

function codeOptions(items: Record<string, unknown>[]): SignalFormOption[] {
  return items.flatMap((item) => {
    const code = text(item, "code");
    const name = text(item, "name");
    return code && name ? [{ value: code, label: name }] : [];
  });
}

function categoryOptions(items: Record<string, unknown>[]): SignalFormOption[] {
  return items.flatMap((item) => {
    const id = number(item, "idCategory");
    const name = text(item, "name");
    const fcv = text(item, "fcv");
    return id && name ? [{ value: String(id), label: fcv ? `${name} · ${fcv}` : name }] : [];
  });
}

async function catalog(name: string, signal?: AbortSignal) {
  return apiRequest<CatalogResponse>(`/catalogs/${name}`, { signal });
}

export async function getSignalFormOptions(token: string, signal?: AbortSignal): Promise<SignalFormOptions> {
  const [categories, signalTypes, sources] = await Promise.all([
    catalog("categories", signal),
    catalog("signal-types", signal),
    apiRequest<SourceResponse>("/admin/sources", { signal, token })
  ]);
  return {
    categories: categoryOptions(categories.data.items),
    signalTypes: codeOptions(signalTypes.data.items),
    sources: sources.data.map((source) => ({ value: String(source.id), label: `${source.name} · ${source.type.name}` }))
  };
}

export function createSignal(input: SignalInput, token: string) {
  return apiRequest<AdminDetailResponse>("/admin/signals", { method: "POST", body: input, token });
}

export function updateSignal(id: number, input: UpdateSignalInput, token: string) {
  return apiRequest<AdminDetailResponse>(`/admin/signals/${id}`, { method: "PATCH", body: input, token });
}
