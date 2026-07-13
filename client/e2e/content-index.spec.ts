import { expect, test, type Page } from "@playwright/test";

const publication = {
  id: 12, slug: "panorama-del-empaquetado-avanzado", type: { code: "REPORT", name: "Informe" },
  title: "Panorama del empaquetado avanzado",
  summary: "Capacidades, inversiones y retos para el ecosistema regional.",
  featuredMedia: null,
  categories: [{ id: 3, name: "Empaquetado", fcv: { code: "TEC", name: "Tecnología" } }],
  publishedAt: "2026-06-20T12:00:00Z"
};
async function mockCatalogs(page: Page) {
  await page.route("**/api/catalogs/**", (route) => {
    const url = route.request().url();
    const items = url.endsWith("content-types") ? [{ code: "REPORT", name: "Informe" }, { code: "NEWS", name: "Noticia" }]
      : url.endsWith("categories") ? [{ idCategory: 3, name: "Empaquetado" }]
      : [{ code: "TEC", name: "Tecnología" }];
    return route.fulfill({ json: { success: true, message: "Catálogo", data: { name: "test", items } } });
  });
}
test("consulta el índice editorial y persiste filtros", async ({ page }) => {
  await mockCatalogs(page);
  await page.route("**/api/content**", (route) => route.fulfill({ json: { success: true, message: "Contenido", data: { items: [publication], pagination: { page: 1, pageSize: 12, totalItems: 1, totalPages: 1 } } } }));
  await page.goto("/contenido?fcv=TEC");
  await expect(page.getByRole("heading", { level: 1, name: "Contenido del observatorio" })).toBeVisible();
  await expect(page.getByRole("heading", { name: publication.title })).toBeVisible();
  const filters = page.locator("details"); if (await filters.getAttribute("open") === null) await filters.locator("summary").click();
  await page.getByLabel("Buscar").fill("empaquetado");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/search=empaquetado/);
  await expect(page.getByRole("link", { name: "Consultar publicación" })).toHaveAttribute("href", "/contenido/" + publication.slug);
});
test("la página de noticias fija su tipo editorial", async ({ page }) => {
  await mockCatalogs(page);
  let requestedUrl = "";
  await page.route("**/api/content**", (route) => { requestedUrl = route.request().url(); return route.fulfill({ json: { success: true, message: "Contenido", data: { items: [], pagination: { page: 1, pageSize: 12, totalItems: 0, totalPages: 0 } } } }); });
  await page.goto("/noticias?type=REPORT");
  await expect(page.getByRole("heading", { level: 1, name: "Noticias" })).toBeVisible();
  await expect(page.getByLabel("Tipo")).toHaveCount(0);
  expect(requestedUrl).toContain("type=NEWS");
  expect(requestedUrl).not.toContain("type=REPORT");
});
