import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderApp } from "@/test/render-app";
import { storeToken } from "@/features/auth/session-storage";
import type { User } from "@/features/auth/types";

const member: User = {
  id: 7, firstName: "María", lastName: "López", email: "maria@example.test", occupation: "Investigadora",
  active: true, lastLogin: "2026-07-13T09:00:00Z", createdAt: "2026-01-10T12:00:00Z",
  roles: ["MEMBER"], permissions: ["exports:download"]
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
const profile = () => json({ success: true, message: "Perfil", data: member });
const emptySignals = () => json({ success: true, message: "Señales", data: { items: [], pagination: { page: 1, pageSize: 12, totalItems: 0, totalPages: 0 } } });
const emptyCatalog = () => json({ success: true, message: "Catálogo", data: { items: [] } });

function installBlobSupport() {
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:exportacion") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
}

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("acciones públicas de exportación", () => {
  it("solicita cuenta a un visitante y conserva filtros en el retorno", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => String(input).startsWith("/api/catalogs/") ? emptyCatalog() : emptySignals()));
    const { router } = renderApp("/senales?fcv=TECH&page=3");
    const login = within(screen.getByLabelText("Exportar señales")).getByRole("link", { name: "Iniciar sesión" });
    fireEvent.click(login);
    await waitFor(() => expect(router.state.location.pathname).toBe("/iniciar-sesion"));
    expect(router.state.location.state).toEqual({ returnTo: "/senales?fcv=TECH&page=3" });
  });

  it("descarga CSV con JWT y sólo filtros compatibles", async () => {
    storeToken("jwt-member");
    installBlobSupport();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void init;
      const url = String(input);
      if (url === "/api/auth/me") return profile();
      if (url.startsWith("/api/catalogs/")) return emptyCatalog();
      if (url.startsWith("/api/exports/signals.csv")) return new Response(new Blob(["csv"]), { headers: { "content-disposition": "attachment; filename=senales-filtradas.csv", "content-type": "text/csv", "x-row-count": "4", "x-export-id": "12", "x-checksum-sha256": "a".repeat(64) } });
      if (url.startsWith("/api/signals")) return emptySignals();
      return json({ success: false, message: "No existe", code: "NOT_FOUND", errors: [] }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/senales?fcv=TECH&impact=HIGH&page=3&sort=-ips");
    fireEvent.click(await screen.findByRole("button", { name: "Descargar CSV" }));
    expect(await screen.findByText(/4 registros en senales-filtradas.csv/)).toBeInTheDocument();
    const call = fetchMock.mock.calls.find(([url]) => String(url).startsWith("/api/exports/signals.csv"));
    expect(call).toBeDefined();
    const requestUrl = new URL(String(call?.[0]), "https://observatorio.test");
    expect(Object.fromEntries(requestUrl.searchParams)).toEqual({ fcv: "TECH", impact: "HIGH", sort: "-ips" });
    expect(new Headers(call?.[1]?.headers).get("authorization")).toBe("Bearer jwt-member");
  });

  it("presenta una recomendación accionable si se supera el límite", async () => {
    storeToken("jwt-member");
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/auth/me") return profile();
      if (url.startsWith("/api/catalogs/")) return emptyCatalog();
      if (url.startsWith("/api/exports/signals.json")) return json({ success: false, message: "La exportación supera el límite de 5000 registros.", code: "DOMAIN_RULE_VIOLATION", errors: [{ field: "filters", message: "Aplique filtros más específicos." }] }, 422);
      return emptySignals();
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/senales");
    fireEvent.click(await screen.findByRole("button", { name: "Descargar JSON" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/filtros más específicos/);
  });
});

describe("cuenta e historial propio", () => {
  it("muestra el perfil completo y su acceso a exportaciones", async () => {
    storeToken("jwt-member");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(profile()));
    renderApp("/cuenta");
    expect(await screen.findByRole("heading", { name: "Mi cuenta" })).toBeInTheDocument();
    expect(screen.getByText("Investigadora")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Historial de exportaciones/ })).toHaveAttribute("href", "/cuenta/exportaciones");
    expect(screen.getByText("Activa")).toBeInTheDocument();
  });

  it("consulta el historial paginado con JWT y muestra checksum", async () => {
    storeToken("jwt-member");
    const checksum = "b".repeat(64);
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void init;
      if (String(input) === "/api/auth/me") return profile();
      if (String(input) === "/api/exports/history?page=2&pageSize=10") return json({ success: true, message: "Historial", data: { items: [{ id: 4, resource: "signals", format: "csv", filters: { fcv: "TECH" }, rowCount: 18, sizeBytes: 2048, checksum, createdAt: "2026-07-13T10:00:00Z" }], pagination: { page: 2, pageSize: 10, totalItems: 11, totalPages: 2 } } });
      return json({ success: false, message: "No existe", code: "NOT_FOUND", errors: [] }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/cuenta/exportaciones?page=2");
    expect(await screen.findByRole("table", { name: "Exportaciones realizadas por tu cuenta" })).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("CSV")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Ver checksum"));
    expect(screen.getByText(checksum)).toBeInTheDocument();
    const call = fetchMock.mock.calls.find(([url]) => String(url).startsWith("/api/exports/history"));
    expect(new Headers(call?.[1]?.headers).get("authorization")).toBe("Bearer jwt-member");
  });
});
