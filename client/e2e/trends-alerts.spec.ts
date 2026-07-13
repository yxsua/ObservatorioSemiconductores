import { expect, test, type Page } from "@playwright/test";

const trend = {
  id: 7, businessCode: "TRE-2026-000007", title: "Empaquetado avanzado regional",
  narrative: "La capacidad regional converge hacia procesos de mayor densidad.",
  implications: "Aumenta la demanda de talento.", firstSignalDate: "2026-02-01", lastSignalDate: "2026-06-10",
  direction: { code: "GROWING", name: "Creciente" }, maturity: { code: "EMERGING", name: "Emergente" },
  suggestedMaturity: { code: "EMERGING", requirements: {} }, status: { code: "ACTIVE", name: "Activa" },
  metrics: { signalCount: 3, sourceCount: 2, actorCount: 1, fcvCount: 2 },
  signals: [{ id: 42, businessCode: "SIG-2026-000042", title: "Nueva planta", publicationDate: "2026-06-10", statusCode: "VALIDATED", ips: 21, sourceId: 9, fcvCode: "TEC" }],
  actors: [{ id: 2, name: "Centro regional", type: "Academia", country: "México" }],
  createdAt: "2026-02-01T00:00:00Z", updatedAt: "2026-06-10T00:00:00Z"
};
const alert = {
  id: 9, businessCode: "ALT-2026-000009", title: "Riesgo en suministro de materiales",
  executiveSummary: "Una restricción logística requiere seguimiento coordinado.",
  implications: "Puede afectar producción.", recommendations: "Diversificar proveedores.",
  generationDate: "2026-06-20", responseDeadline: "2026-07-01", publicationDate: "2026-06-21",
  activationRule: "Interrupción mayor a siete días.", level: { code: "RED", name: "Rojo", color: "#f00" },
  status: { code: "PUBLISHED", name: "Publicada" }, origin: { code: "MANUAL", name: "Manual" },
  metrics: { signalCount: 1, trendCount: 1, audienceCount: 1 },
  signals: [{ id: 42, businessCode: "SIG-2026-000042", title: "Nueva planta", statusCode: "VALIDATED", ips: 21 }],
  trends: [{ id: 7, businessCode: "TRE-2026-000007", title: trend.title, statusCode: "ACTIVE", maturity: "Emergente" }],
  audiences: [{ code: "GOVERNMENT", name: "Gobierno" }],
  createdAt: "2026-06-20T00:00:00Z", updatedAt: "2026-06-21T00:00:00Z"
};
async function catalogs(page: Page) {
  await page.route("**/api/catalogs/**", (route) => {
    const url = route.request().url();
    const items = url.endsWith("trend-directions") ? [{ code: "GROWING", name: "Creciente" }]
      : url.endsWith("trend-maturity") ? [{ code: "EMERGING", name: "Emergente" }]
      : url.endsWith("alert-levels") ? [{ code: "RED", name: "Rojo" }]
      : [{ code: "GOVERNMENT", name: "Gobierno" }];
    return route.fulfill({ json: { success: true, message: "Catálogo", data: { name: "test", items } } });
  });
}
test("consulta tendencias y aplica filtros en la URL", async ({ page }) => {
  await catalogs(page);
  await page.route("**/api/trends**", (route) => route.fulfill({ json: { success: true, message: "Tendencias", data: { items: [trend], pagination: { page: 1, pageSize: 12, totalItems: 1, totalPages: 1 } } } }));
  await page.goto("/tendencias?maturity=EMERGING");
  await expect(page.getByRole("heading", { level: 1, name: "Tendencias del sector" })).toBeVisible();
  await expect(page.getByRole("heading", { name: trend.title })).toBeVisible();
  const details = page.locator("details"); if (await details.getAttribute("open") === null) await details.locator("summary").click();
  await page.getByLabel("Buscar").fill("empaquetado");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/search=empaquetado/);
});
test("presenta relaciones del detalle de tendencia", async ({ page }) => {
  await page.route("**/api/trends/7", (route) => route.fulfill({ json: { success: true, message: "Tendencia", data: trend } }));
  await page.goto("/tendencias/7");
  await expect(page.getByRole("heading", { level: 1, name: trend.title })).toBeVisible();
  await expect(page.getByRole("link", { name: "Consultar señal" })).toHaveAttribute("href", "/senales/42");
});
test("consulta alertas con filtros públicos", async ({ page }) => {
  await catalogs(page);
  await page.route("**/api/alerts**", (route) => route.fulfill({ json: { success: true, message: "Alertas", data: { items: [alert], pagination: { page: 1, pageSize: 12, totalItems: 1, totalPages: 1 } } } }));
  await page.goto("/alertas?status=PUBLISHED&level=RED");
  await expect(page.getByRole("heading", { level: 1, name: "Alertas estratégicas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: alert.title })).toBeVisible();
  await expect(page.getByText("Nivel Rojo")).toBeVisible();
});
test("presenta audiencias y relaciones del detalle de alerta", async ({ page }) => {
  await page.route("**/api/alerts/9", (route) => route.fulfill({ json: { success: true, message: "Alerta", data: alert } }));
  await page.goto("/alertas/9");
  await expect(page.getByRole("heading", { level: 1, name: alert.title })).toBeVisible();
  await expect(page.getByText("Gobierno")).toBeVisible();
  await expect(page.getByRole("link", { name: "Consultar tendencia" })).toHaveAttribute("href", "/tendencias/7");
});
