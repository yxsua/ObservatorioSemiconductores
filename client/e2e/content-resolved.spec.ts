import { expect, test } from "@playwright/test";

const content = {
  id: 50, slug: "referencias-del-ecosistema", type: { code: "REPORT", name: "Reporte" },
  title: "Referencias del ecosistema", summary: "Entidades y recursos relacionados.", featuredMedia: null,
  categories: [], publishedAt: "2026-07-13T12:00:00Z", versionNumber: 1,
  sections: [{
    id: 1, type: { code: "body", name: "Cuerpo" }, title: "Referencias", position: 1, isCollapsible: false, settings: {},
    blocks: [
      { id: 1, type: { code: "signal", name: "Señal" }, schemaVersion: 1, position: 1, settings: {}, data: { entityId: 9, variant: "compact" }, resolved: { kind: "signal", id: 9, businessCode: "SIG-2026-0009", title: "Nueva capacidad regional", href: "/api/signals/9" } },
      { id: 2, type: { code: "trend", name: "Tendencia" }, schemaVersion: 1, position: 2, settings: {}, data: { entityId: 5, variant: "card" }, resolved: { kind: "trend", id: 5, businessCode: "TRE-2026-0005", title: "Especialización de empaquetado", href: "/api/trends/5", summary: "La región concentra nuevas capacidades.", metadata: { direction: { name: "Creciente" }, maturity: { name: "Emergente" }, metrics: { signalCount: 3, actorCount: 2 }, firstSignalDate: "2026-01-10" } } },
      { id: 3, type: { code: "alert", name: "Alerta" }, schemaVersion: 1, position: 3, settings: { width: "wide" }, data: { entityId: 3, variant: "featured" }, resolved: { kind: "alert", id: 3, businessCode: "ALE-2026-0003", title: "Brecha de talento especializado", href: "/api/alerts/3", summary: "Se requiere coordinación regional.", metadata: { level: { name: "Alta" }, publicationDate: "2026-07-10", metrics: { signalCount: 2, trendCount: 1, audienceCount: 3 } }, relations: { signals: [{ id: 9 }], trends: [{ id: 5 }], audiences: [{ id: 1 }, { id: 2 }] } } },
      { id: 4, type: { code: "image", name: "Imagen" }, schemaVersion: 1, position: 4, settings: { width: "wide" }, data: { mediaId: 4, alt: "Laboratorio regional", caption: "Infraestructura de encapsulado", linkUrl: "https://example.test/informe" }, resolved: { kind: "image", id: 4, filename: "laboratorio.png", originalFilename: null, mimeType: "image/png", extension: "png", sizeBytes: 68, url: "/api/media/4", downloadUrl: "/api/media/4/download" } },
      { id: 5, type: { code: "file", name: "Archivo" }, schemaVersion: 1, position: 5, settings: {}, data: { mediaId: 7, label: "Reporte técnico", description: "Documento completo" }, resolved: { kind: "file", id: 7, filename: "reporte.pdf", originalFilename: "Reporte 2026.pdf", mimeType: "application/pdf", extension: "pdf", sizeBytes: 2048, url: null, downloadUrl: "/api/media/7/download" } },
      { id: 6, type: { code: "signal", name: "Señal" }, schemaVersion: 1, position: 6, settings: {}, data: { entityId: 99, variant: "card" } }
    ]
  }],
  relations: { categories: [], signals: [], trends: [], alerts: [] }
};

test("representa referencias y medios resueltos sin consultas adicionales", async ({ page }) => {
  const entityRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/(signals|trends|alerts)\//.test(request.url())) entityRequests.push(request.url());
  });
  await page.route("**/api/content/" + content.slug, (route) => route.fulfill({ json: { success: true, message: "Contenido", data: content } }));
  await page.route("**/api/media/4", (route) => route.fulfill({ body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"), contentType: "image/png" }));
  await page.goto("/contenido/" + content.slug);

  await expect(page.getByRole("article", { name: "Señal: Nueva capacidad regional" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "Nueva capacidad regional" })).toHaveAttribute("href", "/senales/9");
  await expect(page.getByText("Creciente")).toBeVisible();
  await expect(page.getByText("2 audiencias")).toBeVisible();
  await expect(page.getByRole("img", { name: "Laboratorio regional" })).toBeVisible();
  await expect(page.getByText("Infraestructura de encapsulado")).toBeVisible();
  await expect(page.getByLabel("Archivo: Reporte técnico")).toContainText("PDF · 2 kB");
  await expect(page.getByRole("link", { name: "Inicia sesión para descargar" })).toHaveAttribute("href", "/iniciar-sesion");
  await expect(page.getByText(/todavía no puede mostrarse/)).toBeVisible();
  expect(entityRequests).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
