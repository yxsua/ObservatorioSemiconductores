import type { components, operations, paths } from "@/api/schema";
import type { CatalogOption } from "@/features/catalogs/catalogs.service";

export type Signal = components["schemas"]["Signal"];
export type SignalListQuery = NonNullable<
  operations["listPublicSignals"]["parameters"]["query"]
>;
export type SignalSort = NonNullable<SignalListQuery["sort"]>;
export type SignalLevel = "LOW" | "MEDIUM" | "HIGH";
export type PaginatedSignalsResponse =
  paths["/signals"]["get"]["responses"]["200"]["content"]["application/json"];
export type SignalResponse =
  paths["/signals/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

export interface SignalFilterCatalogs {
  categories: CatalogOption[];
  fcv: CatalogOption[];
}
