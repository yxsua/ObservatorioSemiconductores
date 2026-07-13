import { describe, expect, it } from "vitest";
import { createQueryString } from "./query";

describe("createQueryString", () => {
  it("omite valores vacíos y codifica los filtros", () => {
    expect(createQueryString({
      search: "chips avanzados",
      page: 2,
      active: false,
      empty: "",
      missing: undefined
    })).toBe("?search=chips+avanzados&page=2&active=false");
  });

  it("serializa listas como parámetros repetidos", () => {
    expect(createQueryString({ fcv: ["TECH", "ECONOMIC"] }))
      .toBe("?fcv=TECH&fcv=ECONOMIC");
  });
});
