import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Trend } from "@/features/trends/types";
import type { Alert } from "@/features/alerts/types";
import { renderApp } from "@/test/render-app";

const trend: Trend = {
  id: 7, businessCode: "TRE-2026-000007", title: "Empaquetado avanzado regional",
  narrative: "La capacidad regional converge hacia procesos de mayor densidad.",
  implications: "Aumenta la demanda de talento y equipamiento especializado.",
  firstSignalDate: "2026-02-01", lastSignalDate: "2026-06-10",
  direction: { code: "GROWING", name: "Creciente" }, maturity: { code: "EMERGING", name: "Emergente" },
  suggestedMaturity: { code: "EMERGING", requirements: {} }, status: { code: "ACTIVE", name: "Activa" },
  metrics: { signalCount: 3, sourceCount: 2, actorCount: 1, fcvCount: 2 },
  signals: [{ id: 42, businessCode: "SIG-2026-000042", title: "Nueva planta", publicationDate: "2026-06-10", statusCode: "VALIDATED", ips: 21, sourceId: 9, fcvCode: "TEC" }],
  actors: [{ id: 2, name: "Centro regional", type: "Academia", country: "México", website: "https://example.test" }],
  createdAt: "2026-02-01T00:00:00Z", updatedAt: "2026-06-10T00:00:00Z"
};
const alert: Alert = {
  id: 9, businessCode: "ALT-2026-000009", title: "Riesgo en suministro de materiales",
  executiveSummary: "Una restricción logística requiere seguimiento coordinado.",
  implications: "Puede afectar tiempos de producción.", recommendations: "Diversificar proveedores.",
  generationDate: "2026-06-20", responseDeadline: "2026-07-01", publicationDate: "2026-06-21",
  activationRule: "Interrupción mayor a siete días.", level: { code: "RED", name: "Rojo", color: "#f00" },
  status: { code: "PUBLISHED", name: "Publicada" }, origin: { code: "MANUAL", name: "Manual" },
  metrics: { signalCount: 1, trendCount: 1, audienceCount: 1 },
  signals: [{ id: 42, businessCode: "SIG-2026-000042", title: "Nueva planta", statusCode: "VALIDATED", ips: 21 }],
  trends: [{ id: 7, businessCode: "TRE-2026-000007", title: trend.title, statusCode: "ACTIVE", maturity: "Emergente" }],
  audiences: [{ code: "GOVERNMENT", name: "Gobierno" }],
  createdAt: "2026-06-20T00:00:00Z", updatedAt: "2026-06-21T00:00:00Z"
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
function mockApi() {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/catalogs/")) {
      const items = url.endsWith("trend-directions") ? [{ code: "GROWING", name: "Creciente" }]
        : url.endsWith("trend-maturity") ? [{ code: "EMERGING", name: "Emergente" }]
        : url.endsWith("alert-levels") ? [{ code: "RED", name: "Rojo", color: "#f00" }]
        : [{ code: "GOVERNMENT", name: "Gobierno" }];
      return json({ success: true, message: "Catálogo", data: { name: "test", items } });
    }
    if (url === "/api/trends/7") return json({ success: true, message: "Tendencia", data: trend });
    if (url.startsWith("/api/trends")) return json({ success: true, message: "Tendencias", data: { items: [trend], pagination: { page: 1, pageSize: 12, totalItems: 1, totalPages: 1 } } });
    if (url === "/api/alerts/9") return json({ success: true, message: "Alerta", data: alert });
    if (url.startsWith("/api/alerts")) return json({ success: true, message: "Alertas", data: { items: [alert], pagination: { page: 1, pageSize: 12, totalItems: 1, totalPages: 1 } } });
    throw new Error("Solicitud inesperada: " + url);
  }));
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe("tendencias y alertas públicas", () => {
  it("consulta tendencias y conserva filtros en URL", async () => {
    mockApi(); const { router } = renderApp("/tendencias?maturity=EMERGING");
    expect(await screen.findByRole("heading", { name: trend.title })).toBeInTheDocument();
    expect(screen.getByText("1 filtro activo")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "empaquetado" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(router.state.location.search).toContain("search=empaquetado"));
  });
  it("muestra detalle de tendencia y relaciones navegables", async () => {
    mockApi(); renderApp("/tendencias/7");
    expect(await screen.findByRole("heading", { level: 1, name: trend.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Consultar señal" })).toHaveAttribute("href", "/senales/42");
    expect(screen.queryByText(/metodología interna/i)).not.toBeInTheDocument();
  });
  it("consulta alertas con filtros públicos", async () => {
    mockApi(); renderApp("/alertas?status=PUBLISHED&level=RED");
    expect(await screen.findByRole("heading", { name: alert.title })).toBeInTheDocument();
    expect(screen.getByText("2 filtros activos")).toBeInTheDocument();
    expect(screen.getByText("Nivel Rojo")).toBeInTheDocument();
  });
  it("muestra detalle de alerta, audiencias y relaciones", async () => {
    mockApi(); renderApp("/alertas/9");
    expect(await screen.findByRole("heading", { level: 1, name: alert.title })).toBeInTheDocument();
    expect(screen.getByText("Gobierno")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Consultar tendencia" })).toHaveAttribute("href", "/tendencias/7");
    expect(screen.queryByText(/responsable interno/i)).not.toBeInTheDocument();
  });
});
