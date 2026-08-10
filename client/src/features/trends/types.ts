import type { components, operations, paths } from "@/api/schema";
import type { CatalogOption } from "@/features/catalogs/catalogs.service";

export type Trend = components["schemas"]["Trend"];
export type TrendListQuery = NonNullable<operations["listPublicTrends"]["parameters"]["query"]>;
export type TrendSort = NonNullable<TrendListQuery["sort"]>;
export type PaginatedTrendsResponse = paths["/trends"]["get"]["responses"]["200"]["content"]["application/json"];
export type TrendResponse = paths["/trends/{id}"]["get"]["responses"]["200"]["content"]["application/json"];
export interface TrendFilterCatalogs { categories: CatalogOption[]; directions: CatalogOption[]; maturities: CatalogOption[]; }
