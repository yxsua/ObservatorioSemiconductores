import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicContent } from "./types";
import { renderApp } from "@/test/render-app";

const content: PublicContent = {
  id: 12, slug: "panorama-del-empaquetado-avanzado", type: { code: "REPORT", name: "Reporte" },
  title: "Panorama del empaquetado avanzado", summary: "Una lectura estratégica del ecosistema.",
  featuredMedia: null,
  categories: [{ id: 3, name: "Empaque Avanzado", fcv: { code: "TEC", name: "Tecnología" } }],
  publishedAt: "2026-06-20T12:00:00Z", versionNumber: 2,
  sections: [
    {
      id: 1, type: { code: "body", name: "Cuerpo" }, title: "Hallazgos", position: 1, isCollapsible: false, settings: {},
      blocks: [
        { id: 1, type: { code: "heading", name: "Encabezado" }, schemaVersion: 1, position: 1, data: { text: "Capacidad instalada", level: 3, anchor: "capacidad-instalada" }, settings: {} },
        { id: 2, type: { code: "paragraph", name: "Párrafo" }, schemaVersion: 1, position: 2, data: { text: "Texto **validado** con [fuente](https://example.test).", format: "markdown" }, settings: { width: "narrow" } },
        { id: 3, type: { code: "quote", name: "Cita" }, schemaVersion: 1, position: 3, data: { text: "La colaboración es crítica.", attribution: "Observatorio" }, settings: {} },
        { id: 4, type: { code: "list", name: "Lista" }, schemaVersion: 1, position: 4, data: { style: "unordered", items: ["Talento", "Infraestructura"] }, settings: {} },
        { id: 5, type: { code: "callout", name: "Aviso" }, schemaVersion: 1, position: 5, data: { tone: "info", title: "Nota", text: "Datos sujetos a actualización." }, settings: {} },
        { id: 6, type: { code: "divider", name: "Separador" }, schemaVersion: 1, position: 6, data: {}, settings: {} }
      ]
    },
    {
      id: 2, type: { code: "appendix", name: "Anexo" }, title: "Metodología", position: 2, isCollapsible: true, settings: {},
      blocks: [{ id: 7, type: { code: "paragraph", name: "Párrafo" }, schemaVersion: 1, position: 1, data: { text: "Descripción metodológica.", format: "plain" }, settings: {} }]
    },
    {
      id: 3, type: { code: "body", name: "Cuerpo" }, title: "Datos", position: 3, isCollapsible: false, settings: {},
      blocks: [{ id: 8, type: { code: "chart", name: "Gráfico" }, schemaVersion: 1, position: 1, data: {}, settings: {} }]
    }
  ],
  relations: { categories: [], signals: [], trends: [], alerts: [] }
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("detalle editorial público", () => {
  it("renderiza estructura, bloques de texto y navegación canónica", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ success: true, message: "Contenido", data: content })));
    renderApp("/contenido/" + content.slug);
    expect(await screen.findByRole("heading", { level: 1, name: content.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Hallazgos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Capacidad instalada" })).toHaveAttribute("id", "capacidad-instalada");
    expect(screen.getByText("validado", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "fuente" })).toHaveAttribute("href", "https://example.test");
    expect(screen.getByText("Metodología").closest("summary")).toBeInTheDocument();
    expect(screen.getByText(/todavía no puede mostrarse/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← Volver a publicaciones" })).toHaveAttribute("href", "/publicaciones");
  });
  it("usa el slug configurado para páginas editoriales de módulo", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ success: true, message: "Contenido", data: { ...content, slug: "ecosistema-regional", type: { code: "PAGE", name: "Página" } } }));
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/ecosistema-regional");
    expect(await screen.findByRole("heading", { level: 1, name: content.title })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url) === "/api/content/ecosistema-regional")).toBe(true);
  });
  it("presenta 404 e identificadores inválidos de forma segura", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ success: false, message: "No existe", code: "NOT_FOUND", errors: [] }, 404)));
    const { router } = renderApp("/contenido/no-existe");
    expect(await screen.findByRole("heading", { name: "Publicación no encontrada" })).toBeInTheDocument();
    await router.navigate("/contenido/Slug Invalido");
    expect(await screen.findByText(/dirección no corresponde/)).toBeInTheDocument();
  });
});
