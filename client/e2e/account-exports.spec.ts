import { expect, test } from "@playwright/test";

const member = {
  id: 7, firstName: "María", lastName: "López", email: "maria@example.test", occupation: "Investigadora",
  active: true, lastLogin: "2026-07-13T09:00:00Z", createdAt: "2026-01-10T12:00:00Z",
  roles: ["MEMBER"], permissions: ["exports:download"]
};

const emptySignals = { success: true, message: "Señales", data: { items: [], pagination: { page: 1, pageSize: 12, totalItems: 0, totalPages: 0 } } };
const emptyCatalog = { success: true, message: "Catálogo", data: { items: [] } };

test("un visitante conserva la consulta al solicitar una cuenta para exportar", async ({ page }) => {
  await page.route("**/api/signals**", (route) => route.fulfill({ json: emptySignals }));
  await page.route("**/api/catalogs/**", (route) => route.fulfill({ json: emptyCatalog }));
  await page.goto("/senales?fcv=TECH&page=3");
  const actions = page.getByLabel("Exportar señales");
  await expect(actions.getByRole("link", { name: "Iniciar sesión" })).toBeVisible();
  await expect(actions.getByRole("link", { name: "Crear cuenta" })).toBeVisible();
  await actions.getByRole("link", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("heading", { name: "Crear cuenta" })).toBeVisible();
});

test("una cuenta MEMBER exporta los filtros compatibles en CSV", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("observatorio.session.token", "jwt-member"));
  let exportUrl = "";
  await page.route("**/api/auth/me", (route) => route.fulfill({ json: { success: true, message: "Perfil", data: member } }));
  await page.route("**/api/signals**", (route) => route.fulfill({ json: emptySignals }));
  await page.route("**/api/catalogs/**", (route) => route.fulfill({ json: emptyCatalog }));
  await page.route("**/api/exports/signals.csv**", async (route) => {
    exportUrl = route.request().url();
    await route.fulfill({
      body: "codigo,titulo\nSIG-1,Prueba\n",
      contentType: "text/csv",
      headers: {
        "content-disposition": "attachment; filename=senales-filtradas.csv",
        "x-checksum-sha256": "a".repeat(64),
        "x-export-id": "12",
        "x-row-count": "1"
      }
    });
  });
  await page.goto("/senales?fcv=TECH&impact=HIGH&page=3&sort=-ips");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar CSV" }).click();
  await expect((await download).suggestedFilename()).toBe("senales-filtradas.csv");
  await expect(page.getByText(/1 registros en senales-filtradas.csv/)).toBeVisible();
  const request = new URL(exportUrl);
  expect(Object.fromEntries(request.searchParams)).toEqual({ fcv: "TECH", impact: "HIGH", sort: "-ips" });
});

test("la cuenta consulta únicamente su historial paginado", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("observatorio.session.token", "jwt-member"));
  await page.route("**/api/auth/me", (route) => route.fulfill({ json: { success: true, message: "Perfil", data: member } }));
  await page.route("**/api/exports/history**", (route) => route.fulfill({ json: { success: true, message: "Historial", data: { items: [{ id: 4, resource: "signals", format: "csv", filters: { fcv: "TECH" }, rowCount: 18, sizeBytes: 2048, checksum: "b".repeat(64), createdAt: "2026-07-13T10:00:00Z" }], pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 } } } }));
  await page.goto("/cuenta/exportaciones");
  await expect(page.getByRole("heading", { name: "Historial de exportaciones" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Exportaciones realizadas por tu cuenta" })).toBeVisible();
  await expect(page.getByText("18")).toBeVisible();
  await page.getByText("Ver checksum").click();
  await expect(page.getByText("b".repeat(64))).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("un JWT rechazado informa la expiración y conserva la ruta protegida", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("observatorio.session.token", "jwt-expirado"));
  await page.route("**/api/auth/me", (route) => route.fulfill({ status: 401, json: { success: false, message: "Sesión expirada", code: "UNAUTHORIZED", errors: [] } }));
  await page.goto("/cuenta/exportaciones");
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  await expect(page.getByText("Tu sesión terminó.")).toBeVisible();
  await page.getByLabel("Correo electrónico").fill("maria@example.test");
  await page.getByLabel("Contraseña").fill("Password1");
  await page.route("**/api/auth/login", (route) => route.fulfill({ json: { success: true, message: "Sesión", data: { user: member, token: "jwt-nuevo" } } }));
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/cuenta\/exportaciones$/);
});
