import { expect, test } from "@playwright/test";

test("la aplicación monta la fundación del observatorio", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Observatorio de Semiconductores/);
  await expect(page.getByRole("heading", {
    level: 1,
    name: "Comprende el presente y el futuro de los semiconductores"
  })).toBeVisible();
});

test("los módulos tienen rutas y metadatos propios", async ({ page }) => {
  await page.goto("/vigilancia");
  await expect(page.getByRole("heading", { level: 1, name: "Vigilancia tecnológica" }))
    .toBeVisible();
  await expect(page).toHaveTitle("Vigilancia tecnológica | Observatorio de Semiconductores");
});

test("el menú móvil abre la navegación pública", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Validación exclusiva del menú móvil");
  await page.goto("/");
  const menu = page.locator('button[aria-controls="public-navigation"]');
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "Navegación principal" })
    .getByRole("link", { name: "Boletines" })).toBeVisible();
});
