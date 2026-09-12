import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Signal } from "./types";
import { renderApp } from "@/test/render-app";

const signalFixture: Signal = {
  id: 42,
  businessCode: "SIG-2026-000042",
  title: "Nueva capacidad de litografía avanzada",
  summary: "Una inversión amplía la capacidad regional para procesos avanzados.",
  publicationDate: "2026-06-15",
  captureDate: "2026-06-17",
  evidenceUrl: "https://example.test/evidencia",
  ips: 21,
  priority: "HIGH",
  category: { id: 1, name: "Litografía", fcv: { code: "TEC", name: "Tecnología" } },
  source: { id: 9, name: "Fuente sectorial" },
  signalType: { code: "STRONG", name: "Fuerte" },
  impact: { code: "HIGH", name: "Alto" },
  urgency: { code: "MEDIUM", name: "Media" },
  reliability: { code: "HIGH", name: "Alta" },
  scope: { code: "REGIONAL", name: "Regional" },
  status: { code: "VALIDATED", name: "Validada" },
  keywords: [{ id: 3, name: "litografía" }],
  relations: { linkedToTrend: true, linkedToAlert: false },
  createdAt: "2026-06-17T12:00:00Z",
  updatedAt: "2026-06-18T12:00:00Z"
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function catalogPayload(url: string) {
  if (url.endsWith("/categories")) return [{ idCategory: 1, name: "Litografía" }];
  if (url.endsWith("/fcv")) return [{ idFcv: 1, code: "TEC", name: "Tecnología" }];
  return [{ idScope: 1, code: "REGIONAL", name: "Regional" }];
}

function mockSignalsApi(items: Signal[] = [signalFixture]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/catalogs/")) {
      return json({ success: true, message: "Catálogo", data: { name: "test", items: catalogPayload(url) } });
    }
    if (url === "/api/signals/42") {
      return json({ success: true, message: "Señal", data: signalFixture });
    }
    if (url.startsWith("/api/signals")) {
      return json({
        success: true,
        message: "Señales",
        data: {
          items,
          pagination: { page: 1, pageSize: 12, totalItems: items.length, totalPages: 1 }
        }
      });
    }
    throw new Error(`Solicitud inesperada: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("señales públicas", () => {
  it("consulta y presenta filtros persistidos en la URL", async () => {
    const fetchMock = mockSignalsApi();
    const { router } = renderApp("/senales?search=chips&impact=HIGH&sort=-ips");

    expect(await screen.findByRole("heading", { name: signalFixture.title }))
      .toBeInTheDocument();
    expect(screen.getByText("21/27")).toBeInTheDocument();
    expect(screen.getByText("2 filtros activos")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => {
      const value = String(url);
      return value.startsWith("/api/signals?")
        && value.includes("search=chips")
        && value.includes("impact=HIGH")
        && value.includes("sort=-ips");
    })).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
  });

  it("actualiza la URL al aplicar controles del formulario", async () => {
    mockSignalsApi();
    const { router } = renderApp("/senales");
    await screen.findByRole("heading", { name: signalFixture.title });

    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "litografía" } });
    fireEvent.click(screen.getByRole("button", { name: /Seleccionar factores/ }));
    fireEvent.click(screen.getByLabelText("Tecnolog\u00eda"));
    fireEvent.click(screen.getByText("Listo"));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() => expect(router.state.location.search)
      .toContain("search=litograf%C3%ADa"));
    expect(router.state.location.search).toContain("fcvCodes=TEC");
    expect(screen.queryByLabelText("Alcance")).not.toBeInTheDocument();
  });

  it("distingue una colección vacía sin inventar contenido", async () => {
    mockSignalsApi([]);
    renderApp("/senales");
    expect(await screen.findByRole("heading", { name: "No encontramos señales" }))
      .toBeInTheDocument();
    expect(screen.getByText(/Aún no hay señales validadas/)).toBeInTheDocument();
  });

  it("presenta únicamente el detalle público y sus relaciones disponibles", async () => {
    mockSignalsApi();
    renderApp("/senales/42");

    expect(await screen.findByRole("heading", { level: 1, name: signalFixture.title }))
      .toBeInTheDocument();
    const assessment = screen.getByRole("region", { name: "Perfil de la señal" });
    expect(within(assessment).getByText("21")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Consultar evidencia/ }))
      .toHaveAttribute("href", signalFixture.evidenceUrl);
    expect(screen.getByRole("link", { name: "Explorar tendencias" }))
      .toHaveAttribute("href", "/tendencias");
    expect(screen.queryByText(/analista/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/notas internas/i)).not.toBeInTheDocument();
  });

  it("trata un identificador inexistente como señal no encontrada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({
      success: false,
      message: "La señal no existe.",
      code: "NOT_FOUND",
      errors: []
    }, 404)));
    renderApp("/senales/999");
    expect(await screen.findByRole("heading", { name: "Señal no encontrada" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a señales" }))
      .toHaveAttribute("href", "/senales");
  });
});