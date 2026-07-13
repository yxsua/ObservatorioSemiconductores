import { expect, test } from "@playwright/test";

test("una ruta protegida muestra login", async ({ page }) => {
  await page.goto("/cuenta");
  await expect(page.getByRole("heading", { name: "Iniciar sesión" }))
    .toBeVisible();
  await expect(page).toHaveURL(/\/iniciar-sesion$/);
});
