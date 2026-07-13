import { describe, expect, it } from "vitest";
import { transitionsFor } from "./admin-config";
import { adminFiltersFromForm, parseAdminFilters } from "./admin-filters";

describe("patrón administrativo común", () => {
  it("normaliza búsqueda, estado y paginación desde la URL", () => {
    expect(parseAdminFilters("signals", new URLSearchParams("page=3&search=chips&status=new&unknown=x")))
      .toEqual({ page: 3, pageSize: 20, search: "chips", status: "NEW", sort: "-updatedAt" });
    expect(parseAdminFilters("alerts", new URLSearchParams("page=-1&search=x&status=ARCHIVED")))
      .toEqual({ page: 1, pageSize: 20, search: undefined, status: undefined, sort: "-updatedAt" });
  });

  it("serializa sólo los filtros comunes editables", () => {
    const form = new FormData();
    form.set("search", "  empaque  ");
    form.set("status", "UNDER_REVIEW");
    form.set("page", "5");
    expect(adminFiltersFromForm(form).toString()).toBe("search=empaque&status=UNDER_REVIEW");
  });

  it("define transiciones por entidad y estado con su permiso", () => {
    expect(transitionsFor("signals", "NEW").map(({ code, permission }) => [code, permission]))
      .toEqual([["SUBMIT_FOR_REVIEW", "signals:submit"], ["ARCHIVE", "signals:archive"]]);
    expect(transitionsFor("trends", "VALIDATED").map(({ code }) => code)).toEqual(["ACTIVATE", "REOPEN", "ARCHIVE"]);
    expect(transitionsFor("alerts", "PUBLISHED").map(({ code }) => code)).toEqual(["CLOSE", "REOPEN"]);
    expect(transitionsFor("alerts", "CLOSED")).toEqual([]);
  });
});
