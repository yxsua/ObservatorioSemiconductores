import { describe, expect, it } from "vitest";
import { contentFiltersFromForm, countActiveContentFilters, parseContentFilters } from "./content-filters";

describe("filtros del índice editorial", () => {
  it("normaliza filtros y fechas válidas", () => {
    const filters = parseContentFilters(new URLSearchParams("page=2&search=chips&type=news&categoryId=3&fcv=tec&from=2026-01-01&to=2026-06-30&sort=title"));
    expect(filters).toMatchObject({ page: 2, pageSize: 12, search: "chips", type: "NEWS", categoryId: 3, fcv: "TEC", from: "2026-01-01", to: "2026-06-30", sort: "title" });
    expect(countActiveContentFilters(filters)).toBe(6);
  });
  it("descarta valores inválidos y respeta el tipo bloqueado", () => {
    const filters = parseContentFilters(new URLSearchParams("page=-1&search=x&type=REPORT&from=2026-02-30&sort=no"), "NEWS");
    expect(filters).toMatchObject({ page: 1, type: "NEWS", sort: "-publishedAt" });
    expect(filters.search).toBeUndefined();
    expect(filters.from).toBeUndefined();
    expect(countActiveContentFilters(filters, "NEWS")).toBe(0);
  });
  it("evita enviar un intervalo invertido y serializa controles presentes", () => {
    const filters = parseContentFilters(new URLSearchParams("from=2026-06-30&to=2026-01-01"));
    expect(filters.from).toBe("2026-06-30");
    expect(filters.to).toBeUndefined();
    const form = new FormData(); form.set("search", "  encapsulado "); form.set("fcv", "TEC");
    expect(contentFiltersFromForm(form).toString()).toBe("search=encapsulado&fcv=TEC");
  });
});
