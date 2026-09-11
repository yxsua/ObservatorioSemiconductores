import { expect, test } from "@playwright/test";

const content = {
  id: 12, slug: "panorama-del-empaquetado-avanzado", type: { code: "REPORT", name: "Reporte" },
  title: "Panorama del empaquetado avanzado", summary: "Una lectura estratégica del ecosistema.",
  featuredMedia: null,
  categories: [{ id: 3, name: "Empaque Avanzado", fcv: { code: "TEC", name: "Tecnología" } }],
  publishedAt: "2026-06-20T12:00:00Z", versionNumber: 2,
  sections: [
    {
      id: 1, type: { code: "body", name: "Cuerpo" }, title: "Hallazgos", position: 1, isCollapsible: false, settings: {},
      blocks: [
        { id: 1, type: { code: "heading", name: "Encabezado" }, schemaVersion: 1, position: 1, data: { text: "Capacidad instalada", level: 3, anchor: "capacidad-instalada" }, settings: {} },
        { id: 2, type: { code: "paragraph", name: "Párrafo" }, schemaVersion: 1, position: 2, data: { text: "Texto **validado** con [fuente](https://example.test).", format: "markdown" }, settings: { width: "narrow" } },
        { id: 3, type: { code: "quote", name: "Cita" }, schemaVersion: 1, position: 3, data: { text: "La colaboración es crítica.", attribution: "Observatorio" }, settings: {} },
        { id: 4, type: { code: "list", name: "Lista" }, schemaVersion: 1, position: 4, data: { style: "unordered", items: ["Talento", "Infraestructura"] }, settings: {} },
        { id: 5, type: { code: "callout", name: "Aviso" }, schemaVersion: 1, position: 5, data: { tone: "info", title: "Nota", text: "Datos sujetos a actualización." }, settings: {} },
        { id: 6, type: { code: "divider", name: "Separador" }, schemaVersion: 1, position: 6, data: {}, settings: {} }
      ]
    },
    {
      id: 2, type: { code: "appendix", name: "Anexo" }, title: "Metodología", position: 2, isCollapsible: true, settings: {},
      blocks: [{ id: 7, type: { code: "paragraph", name: "Párrafo" }, schemaVersion: 1, position: 1, data: { text: "Descripción metodológica.", format: "plain" }, settings: {} }]
    }
  ],
  relations: { categories: [], signals: [], trends: [], alerts: [] },
  createdAt: "2026-06-19T12:00:00Z", updatedAt: "2026-06-20T12:00:00Z"
};

test("renderiza la estructura editorial y los bloques de texto", async ({ page }) => {
  await page.route("**/api/content/" + content.slug, (route) => route.fulfill({ json: { success: true, message: "Contenido", data: content } }));
  await page.goto("/contenido/" + content.slug);
  await expect(page.getByRole("heading", { level: 1, name: content.title })).toBeVisible();
  await expect(page).toHaveTitle(content.title + " | Observatorio de Semiconductores");
  await expect(page.getByRole("heading", { level: 3, name: "Capacidad instalada" })).toHaveAttribute("id", "capacidad-instalada");
  await expect(page.getByText("validado", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "fuente" })).toHaveAttribute("href", "https://example.test");
  await expect(page.getByText("La colaboración es crítica.")).toBeVisible();
  await expect(page.getByText("Datos sujetos a actualización.")).toBeVisible();
  await page.getByText("Metodología", { exact: true }).click();
  await expect(page.getByText("Descripción metodológica.")).toBeVisible();
});

test("el ecosistema consulta datos estructurados", async ({ page }) => {
  await page.route("**/api/content/**", (route) => route.abort());
  await page.route("**/api/data/ecosystem**", route=>route.fulfill({json:{success:true,data:{items:[],pagination:{page:1,pageSize:20,totalItems:0,totalPages:0}}}}));
  await page.goto("/ecosistema-regional");
  await expect(page.getByRole("heading", { level: 1, name: "Ecosistema regional" })).toBeVisible();
  await expect(page.getByText("No hay registros públicos para esta consulta.")).toBeVisible();
});
