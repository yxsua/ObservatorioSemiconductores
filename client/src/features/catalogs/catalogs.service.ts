import type { paths } from "@/api/schema";
import { apiRequest } from "@/api";

export interface CatalogOption {
  id?: number;
  code?: string;
  name: string;
  color?: string;
}

type CatalogName = paths["/catalogs/{catalog}"]["get"]["parameters"]["path"]["catalog"];
type CatalogResponse = paths["/catalogs/{catalog}"]["get"]["responses"]["200"]["content"]["application/json"];

export async function getCatalogOptions(catalog: CatalogName, signal?: AbortSignal) {
  const response = await apiRequest<CatalogResponse>("/catalogs/" + catalog, { signal });
  return response.data.items.flatMap<CatalogOption>((item) => {
    const name = typeof item.name === "string" ? item.name : null;
    if (!name) return [];
    const rawId = Object.entries(item).find(([key]) => /^id[A-Z]/.test(key))?.[1];
    return [{
      id: typeof rawId === "number" ? rawId : undefined,
      code: typeof item.code === "string" ? item.code : undefined,
      name,
      color: typeof item.color === "string" ? item.color : undefined
    }];
  });
}
