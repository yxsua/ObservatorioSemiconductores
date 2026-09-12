import type { components, operations, paths } from "@/api/schema";
import type { CatalogOption } from "@/features/catalogs/catalogs.service";

export type PublicContentSummary = components["schemas"]["PublicContentSummary"];
export type PublicContent = components["schemas"]["PublicContent"];
export type PublicBlock = components["schemas"]["PublicBlock"];
export type PublicSection = components["schemas"]["PublicSection"];
export type PublicContentListQuery = NonNullable<operations["listPublicContent"]["parameters"]["query"]> & { fcvCodes?: string; categoryIds?: string };
export type PublicContentSort = NonNullable<PublicContentListQuery["sort"]>;
export type PaginatedPublicContentResponse = paths["/content"]["get"]["responses"]["200"]["content"]["application/json"];
export type PublicContentResponse = paths["/content/{slug}"]["get"]["responses"]["200"]["content"]["application/json"];

export interface ContentFilterCatalogs {
  types: CatalogOption[];
  categories: CatalogOption[];
  fcv: CatalogOption[];
}
