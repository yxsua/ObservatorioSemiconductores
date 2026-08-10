import { expect, test } from "@playwright/test";

test("la aplicación monta la fundación del observatorio", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/Observatorio de Semiconductores/);
  await expect(page.getByRole("heading", {
    level: 1,
    name: "Comprende el presente y el futuro de los semiconductores"
  })).toBeVisible();
  expect(errors).toEqual([]);
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

test("la navegación por teclado salta al contenido principal", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Una validación por motor es suficiente");
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Saltar al contenido" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("la aplicación anuncia pérdida y recuperación de red", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Una validación por motor es suficiente");
  await page.goto("/");
  await context.setOffline(true);
  await expect(page.getByRole("status").filter({ hasText: "Sin conexión" })).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByRole("status").filter({ hasText: "Conexión restablecida" })).toBeVisible();
});
