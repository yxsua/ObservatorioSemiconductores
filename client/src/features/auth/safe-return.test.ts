import { describe, expect, it } from "vitest";
import { safeReturnTo } from "./safe-return";

describe("safeReturnTo", () => {
  it("conserva una ruta interna con query y fragmento", () => {
    expect(safeReturnTo("/admin/senales?page=2#results"))
      .toBe("/admin/senales?page=2#results");
  });

  it.each(["https://example.com", "//example.com", "admin", null])(
    "rechaza un retorno externo o inválido: %s",
    (value) => expect(safeReturnTo(value)).toBe("/cuenta")
  );
});
