import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { storeToken } from "@/features/auth/session-storage";
import { renderApp } from "@/test/render-app";

const user = { id: 7, firstName: "Ana", lastName: "Analista", email: "ana@example.test", active: true, roles: ["ANALYST"], permissions: ["signals:read-internal", "signals:create", "signals:update-own"] };

function signal(overrides: Record<string, unknown> = {}) {
  return {
    id: 9, businessCode: "SIG-2026-0009", title: "Capacidad inicial", summary: "Resumen inicial",
    publicationDate: "2026-07-10", captureDate: "2026-07-11", evidenceUrl: "https://example.test/evidencia",
    ips: 23, priority: "HIGH", category: { id: 3, name: "Empaque", fcv: { code: "BACKEND", name: "Backend" } },
    source: { id: 8, name: "Fuente pública" }, signalType: { code: "TECH", name: "Tecnológica" },
    impact: { code: "HIGH", name: "Alto" }, urgency: { code: "MEDIUM", name: "Media" }, reliability: { code: "HIGH", name: "Alta" },
    scope: { code: "REGIONAL", name: "Regional" }, status: { code: "NEW", name: "Nueva" }, keywords: [{ id: 1, name: "encapsulado" }],
    relations: { linkedToTrend: false, linkedToAlert: false }, analyst: { id: 7, name: "Ana Analista" }, validator: null, validationDate: null,
    notes: "Nota inicial", createdAt: "2026-07-11T10:00:00Z", updatedAt: "2026-07-13T10:00:00Z", ...overrides
  };
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
const catalogItems: Record<string, Record<string, unknown>[]> = {
  categories: [{ idCategory: 3, name: "Empaque", fcv: "Backend" }],
  "signal-types": [{ code: "TECH", name: "Tecnológica" }], impacts: [{ code: "HIGH", name: "Alto" }],
  urgencies: [{ code: "MEDIUM", name: "Media" }], "reliability-levels": [{ code: "HIGH", name: "Alta" }],
  scopes: [{ code: "REGIONAL", name: "Regional" }]
};

function optionResponse(url: string) {
  const name = url.replace("/api/catalogs/", "");
  return json({ success: true, message: "Catálogo", data: { name, items: catalogItems[name] ?? [] } });
}

afterEach(() => { cleanup(); sessionStorage.clear(); vi.unstubAllGlobals(); });

describe("captura administrativa de señales", () => {
  it("explica la precondición cuando no existen fuentes activas", async () => {
    storeToken("jwt-analyst");
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/auth/me") return json({ success: true, message: "Perfil", data: user });
      if (url.startsWith("/api/catalogs/")) return optionResponse(url);
      if (url === "/api/admin/sources") return json({ success: true, message: "Fuentes", data: [] });
      return json({ success: false, message: "No existe", code: "NOT_FOUND", errors: [] }, 404);
    }));
    renderApp("/admin/senales/nueva");
    expect(await screen.findByRole("heading", { name: "Sin fuentes activas" }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText(/al menos una fuente activa/i)).toBeInTheDocument();
  });

  it("crea una señal con catálogos y palabras clave sin enviar IPS", async () => {
    storeToken("jwt-analyst");
    let body: Record<string, unknown> | undefined;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/auth/me") return json({ success: true, message: "Perfil", data: user });
      if (url.startsWith("/api/catalogs/")) return optionResponse(url);
      if (url === "/api/admin/sources") return json({ success: true, message: "Fuentes", data: [{ id: 8, name: "Fuente pública", type: { code: "NEWS", name: "Noticias" } }] });
      if (url === "/api/admin/signals" && init?.method === "POST") { body = JSON.parse(String(init.body)); return json({ success: true, message: "Creada", data: signal({ title: body?.title }) }, 201); }
      if (url === "/api/admin/signals/9/history") return json({ success: true, message: "Historial", data: [] });
      if (url === "/api/admin/signals/9") return json({ success: true, message: "Detalle", data: signal({ title: body?.title }) });
      if (url.startsWith("/api/admin/signals?")) return json({ success: true, message: "Listado", data: { items: [signal()], pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } } });
      return json({ success: false, message: "No existe", code: "NOT_FOUND", errors: [] }, 404);
    }));
    const { router } = renderApp("/admin/senales/nueva");
    await screen.findByRole("heading", { name: "Nueva señal" }, { timeout: 5000 });
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Nueva capacidad regional" } });
    fireEvent.change(screen.getByLabelText("Resumen"), { target: { value: "Se amplía la capacidad de prueba." } });
    fireEvent.change(screen.getByLabelText("Fecha de publicación"), { target: { value: "2026-07-13" } });
    fireEvent.change(screen.getByLabelText("Tipo de señal"), { target: { value: "TECH" } });
    fireEvent.change(screen.getByLabelText("URL de evidencia"), { target: { value: "https://example.test/nueva" } });
    fireEvent.change(screen.getByLabelText("Categoría y FCV"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Fuente"), { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("Impacto"), { target: { value: "HIGH" } });
    fireEvent.change(screen.getByLabelText("Urgencia"), { target: { value: "MEDIUM" } });
    fireEvent.change(screen.getByLabelText("Confiabilidad"), { target: { value: "HIGH" } });
    fireEvent.change(screen.getByLabelText("Alcance"), { target: { value: "REGIONAL" } });
    fireEvent.change(screen.getByLabelText("Palabras clave"), { target: { value: "encapsulado, talento" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear señal" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/admin/senales/9"));
    expect(body).toMatchObject({ categoryId: 3, sourceId: 8, keywords: ["encapsulado", "talento"] });
    expect(body).not.toHaveProperty("ips");
    expect(body).not.toHaveProperty("priority");
    expect(body).not.toHaveProperty("status");
  });

  it("conserva el formulario ante 409 y permite recargar la versión vigente", async () => {
    storeToken("jwt-analyst");
    let current = signal();
    let patchBody: Record<string, unknown> | undefined;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/auth/me") return json({ success: true, message: "Perfil", data: user });
      if (url.startsWith("/api/catalogs/")) return optionResponse(url);
      if (url === "/api/admin/sources") return json({ success: true, message: "Fuentes", data: [{ id: 8, name: "Fuente pública", type: { code: "NEWS", name: "Noticias" } }] });
      if (url === "/api/admin/signals/9" && init?.method === "PATCH") { patchBody = JSON.parse(String(init.body)); current = signal({ title: "Versión del servidor", updatedAt: "2026-07-13T11:00:00Z" }); return json({ success: false, message: "Modificada por otra persona", code: "CONCURRENT_MODIFICATION", errors: [] }, 409); }
      if (url === "/api/admin/signals/9") return json({ success: true, message: "Detalle", data: current });
      return json({ success: false, message: "No existe", code: "NOT_FOUND", errors: [] }, 404);
    }));
    renderApp("/admin/senales/9/editar");
    const title = await screen.findByLabelText("Título");
    fireEvent.change(title, { target: { value: "Mi cambio sin guardar" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/cambió en otra sesión/i);
    expect(title).toHaveValue("Mi cambio sin guardar");
    expect(patchBody).toMatchObject({ title: "Mi cambio sin guardar", updatedAt: "2026-07-13T10:00:00Z" });
    fireEvent.click(screen.getByRole("button", { name: "Recargar versión actual" }));
    await waitFor(() => expect(screen.getByLabelText("Título")).toHaveValue("Versión del servidor"));
  });
});
