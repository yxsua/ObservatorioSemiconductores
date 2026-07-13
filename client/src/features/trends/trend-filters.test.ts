import { describe, expect, it } from "vitest";
import { countActiveTrendFilters, parseTrendFilters, trendFiltersFromForm } from "./trend-filters";

describe("filtros públicos de tendencias", () => {
  it("normaliza valores válidos", () => {
    const filters = parseTrendFilters(new URLSearchParams("page=2&search=chips&direction=growing&maturity=emerging&sort=-signalCount"));
    expect(filters).toMatchObject({ page: 2, pageSize: 12, search: "chips", direction: "GROWING", maturity: "EMERGING", sort: "-signalCount" });
    expect(countActiveTrendFilters(filters)).toBe(3);
  });
  it("descarta valores inválidos y serializa controles presentes", () => {
    expect(parseTrendFilters(new URLSearchParams("page=-1&search=x&sort=no")).sort).toBe("-updatedAt");
    const form = new FormData(); form.set("search", "  empaquetado "); form.set("maturity", "EMERGING");
    expect(trendFiltersFromForm(form).toString()).toBe("search=empaquetado&maturity=EMERGING");
  });
});
