import {readFileSync} from "node:fs";
import { expect, test } from "@playwright/test";

const analyst = {
  id: 7,
  firstName: "Ana",
  lastName: "Analista",
  email: "ana@example.test",
  active: true,
  roles: ["ANALYST"],
  permissions: ["signals:read-internal", "signals:create", "signals:submit", "signals:archive"]
};

const signal = (status = "NEW") => ({
  id: 9,
  businessCode: "SIG-2026-0009",
  title: "Nueva capacidad regional",
  summary: "La capacidad de prueba aumenta.",
  status: { code: status, name: status === "NEW" ? "Nueva" : "En revisión" },
  updatedAt: "2026-07-13T10:00:00Z",
  analyst: { id: 7, name: "Ana Analista" },
  ips: 23,
  priority: "HIGH",
  category: { name: "Empaque" },
  source: { name: "Fuente pública" },
  impact: { name: "Alto" },
  reliability: { name: "Alta" },
  evidenceUrl: "https://example.test/evidencia",
  keywords: [],
  notes: null
});

const history = [{
  id: 1,
  fromStatus: null,
  toStatus: { code: "NEW", name: "Nueva" },
  transition: "CREATE",
  changedBy: { id: 7, name: "Ana Analista" },
  notes: null,
  changedAt: "2026-07-13T09:00:00Z"
}];

test("una analista consulta, filtra y cambia el estado de una señal", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("observatorio.session.token", "jwt-analyst"));
  let currentStatus = "NEW";
  let transitionBody: unknown;
  await page.route("**/api/auth/me", (route) => route.fulfill({ json: { success: true, message: "Perfil", data: analyst } }));
  await page.route("**/api/admin/signals**", async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (url.pathname.endsWith("/9/transitions") && method === "POST") {
      transitionBody = route.request().postDataJSON();
      currentStatus = "UNDER_REVIEW";
      await route.fulfill({ json: { success: true, message: "Transición aplicada", data: signal(currentStatus) } });
      return;
    }
    if (url.pathname.endsWith("/9/history")) {
      await route.fulfill({ json: { success: true, message: "Historial", data: history } });
      return;
    }
    if (url.pathname.endsWith("/9")) {
      await route.fulfill({ json: { success: true, message: "Detalle", data: signal(currentStatus) } });
      return;
    }
    await route.fulfill({ json: { success: true, message: "Listado", data: { items: [signal(currentStatus)], pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } } } });
  });

  await page.goto("/admin/senales?status=NEW&search=capacidad");
  await expect(page.getByRole("table", { name: "Señales disponibles en el flujo interno" })).toBeVisible();
  await expect(page.getByLabel("Navegación interna").getByRole("link", { name: "Señales" })).toBeVisible();
  await page.getByRole("link", { name: "Abrir señal: Nueva capacidad regional" }).click();
  const panel = page.getByLabel("Detalle de señal: Nueva capacidad regional");
  await expect(panel.getByText("23/27")).toBeVisible();
  await expect(panel.getByText("CREATE")).toBeVisible();
  const submit = panel.getByRole("button", { name: "Enviar a revisión" });
  await submit.focus();
  await submit.press("Enter");
  const dialog = page.getByRole("alertdialog");
  await dialog.getByLabel(/Notas de la transición/).fill("Lista para validar");
  const confirm = dialog.getByRole("button", { name: "Confirmar enviar a revisión" });
  await confirm.focus();
  await confirm.press("Enter");
  await expect(dialog).toBeHidden();
  expect(transitionBody).toEqual({ transition: "SUBMIT_FOR_REVIEW", notes: "Lista para validar" });
  const overflowing = await page.locator("body *").evaluateAll((elements) => elements
    .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
    .map((element) => `${element.tagName}.${element.className}`));
  expect(overflowing).toEqual([]);
});

test("una cuenta sin permisos internos no puede abrir la vigilancia administrativa", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("observatorio.session.token", "jwt-member"));
  await page.route("**/api/auth/me", (route) => route.fulfill({ json: { success: true, message: "Perfil", data: { ...analyst, roles: ["MEMBER"], permissions: ["exports:download"] } } }));
  await page.goto("/admin/senales");
  await expect(page.getByRole("heading", { name: "Permiso insuficiente" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Área interna" })).toHaveCount(0);
});

test("una analista crea una señal y consulta el IPS calculado por el backend", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("observatorio.session.token", "jwt-analyst"));
  let requestBody: Record<string, unknown> | undefined;
  const methodology=JSON.parse(readFileSync(new URL("../../backend/src/domain/assessment-methodology.json",import.meta.url),"utf8"));
  const catalogItems: Record<string, Record<string, unknown>[]> = {
    categories: [{ idCategory: 3, name: "Empaque", fcv: "Backend" }],
    "signal-types": [{ code: "TECH", name: "Tecnológica" }], impacts: [{ code: "HIGH", name: "Alto" }],
    urgencies: [{ code: "MEDIUM", name: "Media" }], "reliability-levels": [{ code: "HIGH", name: "Alta" }],
    scopes: [{ code: "REGIONAL", name: "Regional" }]
  };
  await page.route("**/api/auth/me", (route) => route.fulfill({ json: { success: true, message: "Perfil", data: analyst } }));
  await page.route("**/api/catalogs/*", (route) => {
    const name = new URL(route.request().url()).pathname.split("/").at(-1)!;
    return route.fulfill({ json: { success: true, message: "Catálogo", data: name==="assessment-methodology"?methodology:{ name, items: catalogItems[name] ?? [] } } });
  });
  await page.route("**/api/admin/sources", (route) => route.fulfill({ json: { success: true, message: "Fuentes", data: [{ id: 8, name: "Fuente pública", type: { code: "NEWS", name: "Noticias" } }] } }));
  await page.route("**/api/admin/signals**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/history")) { await route.fulfill({ json: { success: true, message: "Historial", data: history } }); return; }
    if (route.request().method() === "POST") { requestBody = route.request().postDataJSON(); await route.fulfill({ status: 201, json: { success: true, message: "Creada", data: signal() } }); return; }
    if (url.pathname.endsWith("/9")) { await route.fulfill({ json: { success: true, message: "Detalle", data: signal() } }); return; }
    await route.fulfill({ json: { success: true, message: "Listado", data: { items: [signal()], pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } } } });
  });
  await page.goto("/admin/senales/nueva");
  await page.getByLabel("Título", { exact: true }).fill("Nueva capacidad regional");
  await page.getByLabel("Resumen", { exact: true }).fill("Se amplía la capacidad de prueba.");
  await page.getByLabel("Fecha de publicación", { exact: true }).fill("2026-07-13");
  await page.getByLabel("Tipo de señal", { exact: true }).selectOption("TECH");
  await page.getByLabel("URL de evidencia", { exact: true }).fill("https://example.test/nueva");
  await page.getByLabel("Categoría y FCV", { exact: true }).selectOption("3");
  await page.getByLabel("Fuente", { exact: true }).selectOption("8");
  await page.getByRole("button",{name:"Capturar valoración"}).click();
  for(const select of await page.getByRole("dialog").locator("select").all())await select.selectOption((await select.getAttribute("id"))!.startsWith("reliability")?"YES":"2");
  await page.getByRole("button",{name:"Aplicar valoración"}).click();
  await page.getByLabel("Palabras clave", { exact: true }).fill("encapsulado, talento");
  await page.getByRole("button", { name: "Crear señal" }).click();
  await expect(page).toHaveURL(/\/admin\/senales\/9$/);
  await expect(page.getByLabel("Detalle de señal: Nueva capacidad regional").getByText("23/27")).toBeVisible();
  expect(requestBody).toMatchObject({ categoryId: 3, sourceId: 8, keywords: ["encapsulado", "talento"] });
  expect(requestBody).not.toHaveProperty("ips");
});
