import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicContentSummary } from "./types";
import { renderApp } from "@/test/render-app";

const publication: PublicContentSummary = {
  id: 12,
  slug: "panorama-del-empaquetado-avanzado",
  type: { code: "REPORT", name: "Informe" },
  title: "Panorama del empaquetado avanzado",
  summary: "Capacidades, inversiones y retos para el ecosistema regional.",
  featuredMedia: { id: 5, filename: "portada.webp", mimeType: "image/webp" },
  categories: [{ id: 3, name: "Empaquetado", fcv: { code: "TEC", name: "Tecnología" } }],
  publishedAt: "2026-06-20T12:00:00Z"
};
const json = (data: unknown) => new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } });
function mockContentApi(items: PublicContentSummary[] = [publication]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/catalogs/")) {
      const catalogItems = url.endsWith("content-types") ? [{ code: "REPORT", name: "Informe" }]
        : url.endsWith("categories") ? [{ idCategory: 3, name: "Empaquetado" }]
        : [{ code: "TEC", name: "Tecnología" }];
      return json({ success: true, message: "Catálogo", data: { name: "test", items: catalogItems } });
    }
    if (url.startsWith("/api/content")) return json({ success: true, message: "Contenido", data: { items, pagination: { page: 1, pageSize: 12, totalItems: items.length, totalPages: 1 } } });
    throw new Error("Solicitud inesperada: " + url);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("índice editorial público", () => {
  it("consulta contenido, presenta medio y conserva filtros en URL", async () => {
    mockContentApi(); const { router } = renderApp("/contenido?fcv=TEC");
    expect(await screen.findByRole("heading", { name: publication.title })).toBeInTheDocument();
    expect(screen.getByRole("presentation")).toHaveAttribute("src", "/api/media/5");
    expect(screen.getByRole("link", { name: "Consultar publicación" })).toHaveAttribute("href", "/contenido/" + publication.slug);
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "empaquetado" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(router.state.location.search).toContain("search=empaquetado"));
  });
  it("bloquea el tipo editorial en las páginas de colección", async () => {
    const fetchMock = mockContentApi();
    renderApp("/noticias?type=REPORT");
    expect(await screen.findByRole("heading", { level: 1, name: "Noticias" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Tipo")).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("type=NEWS"))).toBe(true);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("type=REPORT"))).toBe(false);
  });
  it("distingue una colección editorial vacía", async () => {
    mockContentApi([]);
    renderApp("/contenido");
    expect(await screen.findByRole("heading", { name: "No encontramos publicaciones" })).toBeInTheDocument();
    expect(screen.getByText(/Aún no hay contenido publicado/)).toBeInTheDocument();
  });
});
