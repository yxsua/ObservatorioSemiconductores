import { ApiError, apiRequest } from "@/api";
import { getCatalogOptions } from "@/features/catalogs/catalogs.service";
import type { ContentFilterCatalogs, PaginatedPublicContentResponse, PublicContent, PublicContentListQuery, PublicContentResponse } from "./types";

export async function listPublicContent(query: PublicContentListQuery, signal?: AbortSignal) {
  return (await apiRequest<PaginatedPublicContentResponse>("/content", { query, signal })).data;
}

export async function getPublicContent(slug: string, signal?: AbortSignal): Promise<PublicContent> {
  const response = await apiRequest<PublicContentResponse>("/content/" + slug, { signal });
  if (!response.data) {
    throw new ApiError("La API no devolvió el contenido solicitado.", {
      status: 502,
      code: "INVALID_RESPONSE"
    });
  }
  return response.data;
}

export async function getContentFilterCatalogs(signal?: AbortSignal): Promise<ContentFilterCatalogs> {
  const [types, categories, fcv] = await Promise.all([
    getCatalogOptions("content-types", signal),
    getCatalogOptions("categories", signal),
    getCatalogOptions("fcv", signal)
  ]);
  return { types, categories, fcv };
}
