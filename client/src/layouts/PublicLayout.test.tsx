import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderApp } from "@/test/render-app";

afterEach(cleanup);

describe("shell público", () => {
  it("expone los módulos principales y controla el menú", () => {
    renderApp("/");
    const toggle = document.querySelector<HTMLButtonElement>('button[aria-controls="public-navigation"]');
    expect(toggle).not.toBeNull();
    if (!toggle) throw new Error("No se encontró el control del menú");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("link", { name: "Dashboard ejecutivo" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Noticias" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Industria de semiconductores" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Vigilancia Tecnológica" }).length).toBeGreaterThan(0);
  });

  it("renderiza una página modular y actualiza sus metadatos", async () => {
    renderApp("/boletines");
    expect(screen.getByRole("heading", { level: 1, name: "Boletines" }))
      .toBeInTheDocument();
    await waitFor(() => expect(document.title)
      .toBe("Boletines | Observatorio de Semiconductores"));
    expect(document.querySelector('meta[name="description"]'))
      .toHaveAttribute("content", expect.stringContaining("Síntesis periódicas"));
  });

  it("presenta señales, tendencias y alertas dentro de vigilancia", () => {
    renderApp("/vigilancia");
    expect(screen.getByRole("heading", { level: 1, name: "Vigilancia tecnológica" }))
      .toBeInTheDocument();
    const resources = screen.getByRole("region", { name: "Explora la vigilancia tecnológica" });
    expect(within(resources).getByRole("link", { name: /Señales/ })).toHaveAttribute("href", "/senales");
    expect(within(resources).getByRole("link", { name: /Tendencias/ })).toHaveAttribute("href", "/tendencias");
    expect(within(resources).getByRole("link", { name: /Alertas/ })).toHaveAttribute("href", "/alertas");
  });
});
