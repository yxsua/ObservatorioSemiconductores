import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicContent } from "./types";
import { renderApp } from "@/test/render-app";

const fileBlock = {
  id: 40, type: { code: "file", name: "Archivo" }, schemaVersion: 1, position: 1, settings: {},
  data: { mediaId: 7, label: "Reporte técnico", description: "Documento completo" },
  resolved: { kind: "file" as const, id: 7, filename: "reporte.pdf", originalFilename: "Reporte 2026.pdf", mimeType: "application/pdf", extension: "pdf", sizeBytes: 2048, url: null, downloadUrl: "/api/media/7/download" }
};

const content: PublicContent = {
  id: 40, slug: "archivo-editorial", type: { code: "REPORT", name: "Reporte" }, title: "Archivo editorial", summary: null,
  featuredMedia: null, categories: [], publishedAt: "2026-07-13T12:00:00Z", versionNumber: 1,
  sections: [{ id: 1, type: { code: "body", name: "Cuerpo" }, title: "Descargas", position: 1, isCollapsible: false, settings: {}, blocks: [fileBlock] }],
  relations: { categories: [], signals: [], trends: [], alerts: [] }
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.sessionStorage.clear();
});

describe("archivos editoriales protegidos", () => {
  it("invita a iniciar sesión y conserva la publicación como retorno", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, message: "Contenido", data: content }), { headers: { "content-type": "application/json" } })));
    const { router } = renderApp("/contenido/archivo-editorial");
    const login = await screen.findByRole("link", { name: "Inicia sesión para descargar" }, { timeout: 5000 });
    expect(login).toHaveAttribute("href", "/iniciar-sesion");
    fireEvent.click(login);
    await waitFor(() => expect(router.state.location.pathname).toBe("/iniciar-sesion"));
    expect(router.state.location.state).toEqual({ returnTo: "/contenido/archivo-editorial" });
  });

  it("descarga con el token de una cuenta autorizada", async () => {
    window.sessionStorage.setItem("observatorio.session.token", "jwt-prueba");
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void init;
      const url = String(input);
      if (url === "/api/auth/me") return new Response(JSON.stringify({ success: true, message: "Perfil", data: { id: 1, email: "member@test.local", firstName: "Ana", lastName: "López", occupation: null, isActive: true, roles: ["MEMBER"], permissions: ["exports:download"] } }), { headers: { "content-type": "application/json" } });
      if (url === "/api/content/archivo-editorial") return new Response(JSON.stringify({ success: true, message: "Contenido", data: content }), { headers: { "content-type": "application/json" } });
      if (url === "/api/media/7/download") return new Response(new Blob(["pdf"]), { headers: { "content-disposition": "attachment; filename=resultado.pdf", "content-type": "application/pdf" } });
      return new Response(null, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:archivo"), revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    renderApp("/contenido/archivo-editorial");
    fireEvent.click(await screen.findByRole("button", { name: "Descargar archivo" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/media/7/download",
      expect.objectContaining({ headers: expect.any(Headers) })
    ));
    const downloadCall = fetchMock.mock.calls.find(([url]) => String(url) === "/api/media/7/download");
    expect(new Headers(downloadCall?.[1]?.headers).get("authorization")).toBe("Bearer jwt-prueba");
  });
});
