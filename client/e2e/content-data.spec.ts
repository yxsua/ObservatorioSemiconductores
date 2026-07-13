import { expect, test } from "@playwright/test";

const content = {
  id: 30, slug: "indicadores-regionales", type: { code: "REPORT", name: "Reporte" },
  title: "Indicadores regionales", summary: "Capacidad e inversión observadas.",
  featuredMedia: null, categories: [], publishedAt: "2026-07-13T12:00:00Z", versionNumber: 1,
  sections: [{
    id: 1, type: { code: "statistics", name: "Indicadores" }, title: "Datos comparables", position: 1, isCollapsible: false, settings: {},
    blocks: [
      {
        id: 1, type: { code: "table", name: "Tabla" }, schemaVersion: 1, position: 1, settings: { width: "wide" },
        data: {
          caption: "Capacidad por región",
          columns: [{ key: "region", label: "Región", type: "text" }, { key: "capacity", label: "Capacidad", type: "number" }, { key: "active", label: "Activa", type: "boolean" }],
          rows: [{ region: "Norte", capacity: 1250.5, active: true }, { region: "Centro", capacity: 980, active: false }]
        }
      },
      {
        id: 2, type: { code: "chart", name: "Gráfico" }, schemaVersion: 1, position: 2, settings: { width: "wide" },
        data: { chartType: "bar", title: "Producción anual", labels: ["2024", "2025", "2026"], series: [{ name: "Unidades", values: [4, 7, 10], color: "#14788a" }] }
      }
    ]
  }],
  relations: { categories: [], signals: [], trends: [], alerts: [] }
};

test("presenta tabla responsive y gráfico con datos equivalentes", async ({ page }) => {
  await page.route("**/api/content/" + content.slug, (route) => route.fulfill({ json: { success: true, message: "Contenido", data: content } }));
  await page.goto("/contenido/" + content.slug);
  const tableRegion = page.getByRole("region", { name: "Capacidad por región" });
  await expect(tableRegion).toBeVisible();
  await expect(page.getByRole("table", { name: "Capacidad por región" })).toBeVisible();
  await expect(page.getByText("1,250.5")).toBeVisible();
  await expect(page.getByRole("img", { name: /Producción anual/ })).toBeVisible();
  await expect(page.getByText("Consultar datos del gráfico")).toBeVisible();
  await page.getByText("Consultar datos del gráfico").click();
  await expect(page.getByRole("table", { name: "Producción anual" })).toBeVisible();
});
