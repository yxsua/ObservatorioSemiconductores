import type { components, operations, paths } from "@/api/schema";
import type { CatalogOption } from "@/features/catalogs/catalogs.service";

export type Alert = components["schemas"]["Alert"];
export type AlertListQuery = NonNullable<operations["listPublicAlerts"]["parameters"]["query"]>;
export type AlertSort = NonNullable<AlertListQuery["sort"]>;
export type AlertLevel = NonNullable<AlertListQuery["level"]>;
export type AlertStatus = "PUBLISHED" | "CLOSED";
export type PaginatedAlertsResponse = paths["/alerts"]["get"]["responses"]["200"]["content"]["application/json"];
export type AlertResponse = paths["/alerts/{id}"]["get"]["responses"]["200"]["content"]["application/json"];
export interface AlertFilterCatalogs { levels: CatalogOption[]; audiences: CatalogOption[]; }
