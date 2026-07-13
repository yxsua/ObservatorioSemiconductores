import { describe, expect, it } from "vitest";
import { compatibleExportFilters, countExportFilters } from "./export-filters";

describe("filtros compatibles de exportación", () => {
  it("conserva los filtros públicos de señales y elimina paginación", () => {
    const filters = compatibleExportFilters("signals", { page: 4, pageSize: 12, search: "chips", fcv: "TECH", impact: "HIGH", sort: "-ips", unknown: "x" });
    expect(filters).toEqual({ search: "chips", fcv: "TECH", impact: "HIGH", sort: "-ips" });
    expect(countExportFilters(filters)).toBe(3);
  });

  it("excluye status de alertas porque el backend no lo admite al exportar", () => {
    expect(compatibleExportFilters("alerts", { status: "CLOSED", level: "RED", audience: "GOV", sort: "-level" }))
      .toEqual({ level: "RED", audience: "GOV", sort: "-level" });
  });

  it("mantiene el tipo fijado por una colección editorial", () => {
    expect(compatibleExportFilters("content", { type: "NEWS", categoryId: 3, page: 2, sort: "-publishedAt" }))
      .toEqual({ type: "NEWS", categoryId: 3, sort: "-publishedAt" });
  });
});
