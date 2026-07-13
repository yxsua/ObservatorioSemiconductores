import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderApp } from "@/test/render-app";
import { storeToken } from "./session-storage";
import type { User } from "./types";

const member: User = {
  id: 7,
  firstName: "María",
  lastName: "López",
  email: "maria@example.test",
  active: true,
  roles: ["MEMBER"],
  permissions: ["exports:download"]
};

function profileResponse(user: User, status = 200) {
  return new Response(JSON.stringify({
    success: status < 400,
    message: status < 400 ? "Perfil actual" : "Sesión expirada",
    ...(status < 400 ? { data: user } : { code: "UNAUTHORIZED", errors: [] })
  }), {
    status,
    headers: { "content-type": "application/json" }
  });
}

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe("sesión y rutas protegidas", () => {
  it("envía a login a quien visita una ruta protegida sin sesión", async () => {
    renderApp("/cuenta");
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" }))
      .toBeInTheDocument();
  });

  it("restaura la sesión con /auth/me antes de mostrar la cuenta", async () => {
    storeToken("jwt-vigente");
    const fetchMock = vi.fn().mockResolvedValue(profileResponse(member));
    vi.stubGlobal("fetch", fetchMock);

    renderApp("/cuenta");

    expect(await screen.findByRole("heading", { name: "Mi cuenta" }))
      .toBeInTheDocument();
    expect(screen.getByText("María López")).toBeInTheDocument();
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(request.headers).get("authorization"))
      .toBe("Bearer jwt-vigente");
  });

  it("bloquea el área interna cuando faltan permisos", async () => {
    storeToken("jwt-member");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(profileResponse(member)));
    renderApp("/admin");
    expect(await screen.findByText("Permiso insuficiente")).toBeInTheDocument();
  });

  it("abre el área interna cuando existe un permiso del módulo", async () => {
    storeToken("jwt-analyst");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(profileResponse({
      ...member,
      roles: ["ANALYST"],
      permissions: ["signals:read-internal"]
    })));
    renderApp("/admin");
    expect(await screen.findByRole("heading", { name: "Área interna" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Señales" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Alertas" }))
      .not.toBeInTheDocument();
  });

  it("elimina una sesión que el backend rechaza", async () => {
    storeToken("jwt-expirado");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(profileResponse(member, 401)));
    renderApp("/cuenta");
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" }))
      .toBeInTheDocument();
    expect(screen.getByText("Tu sesión terminó.")).toBeInTheDocument();
    expect(window.sessionStorage.length).toBe(0);
  });
});
