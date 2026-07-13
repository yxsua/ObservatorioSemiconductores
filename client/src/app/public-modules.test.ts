import { describe, expect, it } from "vitest";
import { PRIMARY_PUBLIC_MODULES, PUBLIC_MODULES } from "./public-modules";

describe("configuración de módulos públicos", () => {
  it("mantiene identificadores y rutas únicos", () => {
    expect(new Set(PUBLIC_MODULES.map((module) => module.id)).size)
      .toBe(PUBLIC_MODULES.length);
    expect(new Set(PUBLIC_MODULES.map((module) => module.path)).size)
      .toBe(PUBLIC_MODULES.length);
  });

  it("vincula colecciones editoriales con tipos soportados", () => {
    const collectionTypes = PUBLIC_MODULES.flatMap((module) =>
      module.source.kind === "collection" ? [module.source.contentType] : []
    );
    expect(collectionTypes).toEqual(["NEWSLETTER", "NEWS", "REPORT"]);
  });

  it("deriva la navegación principal desde la misma configuración", () => {
    expect(PRIMARY_PUBLIC_MODULES.every((module) => module.primaryNavigation))
      .toBe(true);
    expect(PRIMARY_PUBLIC_MODULES.map((module) => module.path))
      .toContain("/ecosistema-regional");
  });
});
