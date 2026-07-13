import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./client";
import { ApiError } from "./errors";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("compone URL, token y cuerpo JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: true, data: { id: 4 } }),
      { status: 200, headers: { "content-type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest<{ success: true; data: { id: number } }>(
      "/signals",
      {
        method: "POST",
        token: "jwt-test",
        query: { page: 2, search: "chip avanzado" },
        body: { title: "Señal" }
      }
    );

    expect(result.data.id).toBe(4);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/signals?page=2&search=chip+avanzado");
    expect(new Headers(request.headers).get("authorization"))
      .toBe("Bearer jwt-test");
    expect(new Headers(request.headers).get("content-type"))
      .toBe("application/json");
    expect(request.body).toBe('{"title":"Señal"}');
  });

  it("conserva FormData sin imponer content-type", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const body = new FormData();
    body.append("file", new Blob(["data"]), "archivo.txt");

    await apiRequest<void>("/media", { method: "POST", body });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(request.headers).has("content-type")).toBe(false);
    expect(request.body).toBe(body);
  });

  it("normaliza errores y detalles por campo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: false,
      message: "Solicitud inválida.",
      code: "VALIDATION_ERROR",
      errors: [{ field: "title", message: "Es obligatorio." }]
    }), { status: 400, headers: { "content-type": "application/json" } })));

    const error = await apiRequest("/signals").catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect((error as ApiError).fieldErrors).toEqual({
      title: ["Es obligatorio."]
    });
  });

  it("distingue fallos de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(apiRequest("/health")).rejects.toMatchObject({
      status: 0,
      code: "NETWORK_ERROR"
    });
  });

  it("no transforma una cancelación", async () => {
    const abort = new DOMException("cancelada", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abort));
    await expect(apiRequest("/health")).rejects.toBe(abort);
  });
});
