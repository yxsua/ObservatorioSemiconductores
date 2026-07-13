import { describe, expect, it } from "vitest";
import { countActiveAlertFilters, parseAlertFilters, alertFiltersFromForm } from "./alert-filters";

describe("filtros públicos de alertas", () => {
  it("restringe estados y niveles al contrato público", () => {
    const filters = parseAlertFilters(new URLSearchParams("status=published&level=red&audience=government&sort=-generationDate"));
    expect(filters).toMatchObject({ status: "PUBLISHED", level: "RED", audience: "GOVERNMENT", sort: "-generationDate" });
    expect(countActiveAlertFilters(filters)).toBe(3);
    expect(parseAlertFilters(new URLSearchParams("status=NEW&level=BLUE"))).toMatchObject({ status: undefined, level: undefined });
  });
  it("serializa únicamente controles con valor", () => {
    const form = new FormData(); form.set("search", "  suministro "); form.set("status", "CLOSED");
    expect(alertFiltersFromForm(form).toString()).toBe("search=suministro&status=CLOSED");
  });
});
