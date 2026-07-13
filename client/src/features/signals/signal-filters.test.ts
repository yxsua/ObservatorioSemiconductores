import { describe, expect, it } from "vitest";
import {
  countActiveSignalFilters,
  parseSignalFilters,
  signalFiltersFromForm
} from "./signal-filters";

describe("filtros públicos de señales", () => {
  it("normaliza parámetros válidos y aplica valores predeterminados", () => {
    const filters = parseSignalFilters(new URLSearchParams(
      "page=2&search=chips&impact=high&categoryId=7&sort=-ips"
    ));
    expect(filters).toMatchObject({
      page: 2,
      pageSize: 12,
      search: "chips",
      impact: "HIGH",
      categoryId: 7,
      sort: "-ips"
    });
    expect(countActiveSignalFilters(filters)).toBe(3);
  });

  it("descarta búsquedas, páginas, fechas y órdenes inválidos", () => {
    const filters = parseSignalFilters(new URLSearchParams(
      "page=-1&search=x&from=hoy&impact=critical&sort=unknown"
    ));
    expect(filters.page).toBe(1);
    expect(filters.search).toBeUndefined();
    expect(filters.from).toBeUndefined();
    expect(filters.impact).toBeUndefined();
    expect(filters.sort).toBe("-publicationDate");
  });

  it("serializa únicamente controles con valor", () => {
    const form = new FormData();
    form.set("search", "  litografía ");
    form.set("fcv", "TEC");
    form.set("scope", "");
    expect(signalFiltersFromForm(form).toString())
      .toBe("search=litograf%C3%ADa&fcv=TEC");
  });
});
