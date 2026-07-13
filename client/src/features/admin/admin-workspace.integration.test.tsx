import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { storeToken } from "@/features/auth/session-storage";
import { renderApp } from "@/test/render-app";

const user = {
  id: 7, firstName: "Ana", lastName: "Analista", email: "ana@example.test", active: true,
  roles: ["ANALYST"], permissions: ["signals:read-internal", "signals:create", "signals:submit", "signals:archive"]
};

function signal(status = "NEW") {
  return {
    id: 9, businessCode: "SIG-2026-0009", title: "Nueva capacidad regional", summary: "La capacidad de prueba aumenta.",
    status: { code: status, name: status === "NEW" ? "Nueva" : "En revisión" }, updatedAt: "2026-07-13T10:00:00Z",
    analyst: { id: 7, name: "Ana Analista" }, ips: 23, priority: "HIGH", category: { name: "Empaque" },
    source: { name: "Fuente pública" }, impact: { name: "Alto" }, reliability: { name: "Alta" },
    evidenceUrl: "https://example.test/evidencia", keywords: [], notes: null
  };
}

const history = [{ id: 1, fromStatus: null, toStatus: { code: "NEW", name: "Nueva" }, transition: "CREATE", changedBy: { id: 7, name: "Ana Analista" }, notes: null, changedAt: "2026-07-13T09:00:00Z" }];
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

afterEach(() => { cleanup(); window.sessionStorage.clear(); vi.unstubAllGlobals(); });

describe("workspace administrativo", () => {
  it("no ofrece un módulo si la cuenta carece del permiso de lectura interna", async () => {
    storeToken("jwt-create-only");
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === "/api/auth/me") return json({ success: true, message: "Perfil", data: { ...user, permissions: ["signals:create"] } });
      return json({ success: false, message: "No existe", code: "NOT_FOUND", errors: [] }, 404);
    }));
    renderApp("/admin");
    expect(await screen.findByRole("heading", { name: "Área interna" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Señales" })).not.toBeInTheDocument();
  });

  it("filtra, abre detalle e historial y confirma una transición permitida", async () => {
    storeToken("jwt-analyst");
    let currentStatus = "NEW";
    let transitionBody: unknown;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/auth/me") return json({ success: true, message: "Perfil", data: user });
      if (url === "/api/admin/signals/9/history") return json({ success: true, message: "Historial", data: history });
      if (url === "/api/admin/signals/9/transitions" && init?.method === "POST") { transitionBody = JSON.parse(String(init.body)); currentStatus = "UNDER_REVIEW"; return json({ success: true, message: "Transición", data: signal(currentStatus) }); }
      if (url === "/api/admin/signals/9") return json({ success: true, message: "Detalle", data: signal(currentStatus) });
      if (url.startsWith("/api/admin/signals?")) return json({ success: true, message: "Listado", data: { items: [signal(currentStatus)], pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } } });
      return json({ success: false, message: "No existe", code: "NOT_FOUND", errors: [] }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);
    const { router } = renderApp("/admin/senales?status=NEW&search=capacidad");
    const table = await screen.findByRole("table", { name: "Señales disponibles en el flujo interno" });
    expect(table).toBeInTheDocument();
    expect(within(table).getByText("Ana Analista")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Abrir señal: Nueva capacidad regional" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/admin/senales/9"));
    const panel = await screen.findByLabelText("Detalle de señal: Nueva capacidad regional");
    expect(within(panel).getByText("23/27")).toBeInTheDocument();
    expect(within(panel).getByText("CREATE")).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole("button", { name: "Enviar a revisión" }));
    const dialog = screen.getByRole("alertdialog");
    fireEvent.change(within(dialog).getByLabelText(/Notas de la transición/), { target: { value: "Lista para validar" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar enviar a revisión" }));
    await waitFor(() => expect(transitionBody).toEqual({ transition: "SUBMIT_FOR_REVIEW", notes: "Lista para validar" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(fetchMock.mock.calls.some(([, init]) => new Headers(init?.headers).get("authorization") === "Bearer jwt-analyst")).toBe(true);
  });

  it("conserva el detalle y ofrece recarga ante concurrencia 409", async () => {
    storeToken("jwt-analyst");
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/auth/me") return json({ success: true, message: "Perfil", data: user });
      if (url === "/api/admin/signals/9/history") return json({ success: true, message: "Historial", data: history });
      if (url === "/api/admin/signals/9/transitions" && init?.method === "POST") return json({ success: false, message: "El registro fue modificado por otro usuario.", code: "CONCURRENT_MODIFICATION", errors: [] }, 409);
      if (url === "/api/admin/signals/9") return json({ success: true, message: "Detalle", data: signal() });
      return json({ success: true, message: "Listado", data: { items: [signal()], pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } } });
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/admin/senales/9");
    const panel = await screen.findByLabelText("Detalle de señal: Nueva capacidad regional");
    fireEvent.click(within(panel).getByRole("button", { name: "Archivar" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Confirmar archivar" }));
    const dialog = screen.getByRole("alertdialog");
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(/registro cambió en otra sesión/i);
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("button", { name: "Recargar registro" })).toBeInTheDocument();
    expect(within(panel).getByRole("heading", { name: "Nueva capacidad regional" })).toBeInTheDocument();
  });
});
