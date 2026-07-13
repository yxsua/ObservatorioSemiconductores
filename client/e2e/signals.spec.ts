import { expect, test, type Page } from "@playwright/test";

const signal = {
  id: 42,
  businessCode: "SIG-2026-000042",
  title: "Nueva capacidad de litografía avanzada",
  summary: "Una inversión amplía la capacidad regional para procesos avanzados.",
  publicationDate: "2026-06-15",
  captureDate: "2026-06-17",
  evidenceUrl: "https://example.test/evidencia",
  ips: 21,
  priority: "HIGH",
  category: { id: 1, name: "Litografía", fcv: { code: "TEC", name: "Tecnología" } },
  source: { id: 9, name: "Fuente sectorial" },
  signalType: { code: "STRONG", name: "Fuerte" },
  impact: { code: "HIGH", name: "Alto" },
  urgency: { code: "MEDIUM", name: "Media" },
  reliability: { code: "HIGH", name: "Alta" },
  scope: { code: "REGIONAL", name: "Regional" },
  status: { code: "VALIDATED", name: "Validada" },
  keywords: [{ id: 3, name: "litografía" }],
  relations: { linkedToTrend: true, linkedToAlert: false },
  createdAt: "2026-06-17T12:00:00Z",
  updatedAt: "2026-06-18T12:00:00Z"
};

async function mockCatalogs(page: Page) {
  await page.route("**/api/catalogs/**", async (route) => {
    const url = route.request().url();
    const items = url.endsWith("/categories")
      ? [{ idCategory: 1, name: "Litografía" }]
      : url.endsWith("/fcv")
        ? [{ idFcv: 1, code: "TEC", name: "Tecnología" }]
        : [{ idScope: 1, code: "REGIONAL", name: "Regional" }];
    await route.fulfill({ json: { success: true, message: "Catálogo", data: { name: "test", items } } });
  });
}

test("consulta señales y conserva los filtros en la URL", async ({ page }) => {
  await mockCatalogs(page);
  await page.route("**/api/signals**", (route) => route.fulfill({
    json: {
      success: true,
      message: "Señales",
      data: {
        items: [signal],
        pagination: { page: 1, pageSize: 12, totalItems: 1, totalPages: 1 }
      }
    }
  }));

  await page.goto("/senales?impact=HIGH");
  await expect(page.getByRole("heading", { level: 1, name: "Señales del sector" })).toBeVisible();
  await expect(page.getByRole("heading", { name: signal.title })).toBeVisible();
  const filters = page.locator("details");
  if (await filters.getAttribute("open") === null) {
    await filters.locator("summary").click();
  }
  await page.getByLabel("Buscar").fill("litografía");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/search=litograf%C3%ADa/);
  await expect(page).toHaveURL(/impact=HIGH/);
});

test("presenta el detalle público de una señal", async ({ page }) => {
  await page.route("**/api/signals/42", (route) => route.fulfill({
    json: { success: true, message: "Señal", data: signal }
  }));
  await page.goto("/senales/42");
  await expect(page.getByRole("heading", { level: 1, name: signal.title })).toBeVisible();
  await expect(page.getByText("21", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Consultar evidencia/ }))
    .toHaveAttribute("href", signal.evidenceUrl);
  await expect(page.getByText("Relacionada con tendencias")).toBeVisible();
});
