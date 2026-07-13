import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { PublicBlock } from "./types";
import { SafeMarkdown } from "./SafeMarkdown";
import { TextBlockRenderer } from "./TextBlockRenderer";

function block(code: string, data: Record<string, unknown>, settings: Record<string, unknown> = {}): PublicBlock {
  return { id: 1, type: { code, name: code }, schemaVersion: 1, position: 1, data, settings };
}
afterEach(cleanup);

describe("bloques editoriales de texto", () => {
  it("renderiza Markdown limitado sin interpretar HTML ni protocolos inseguros", () => {
    render(<p><SafeMarkdown text={"Texto **fuerte**, *énfasis*, \u0060código\u0060, [fuente](https://example.test) y [riesgo](javascript:alert(1)). <script>alert(1)</script>"} /></p>);
    expect(screen.getByText("fuerte", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("énfasis", { selector: "em" })).toBeInTheDocument();
    expect(screen.getByText("código", { selector: "code" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "fuente" })).toHaveAttribute("href", "https://example.test");
    expect(screen.queryByRole("link", { name: "riesgo" })).not.toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
    expect(screen.getByText(/<script>alert/)).toBeInTheDocument();
  });
  it("respeta encabezados, listas y ajustes permitidos", () => {
    const { rerender } = render(<TextBlockRenderer block={block("heading", { text: "Hallazgos", level: 3, anchor: "hallazgos" }, { width: "wide", alignment: "center", background: "muted" })} />);
    expect(screen.getByRole("heading", { level: 3, name: "Hallazgos" })).toHaveAttribute("id", "hallazgos");
    rerender(<TextBlockRenderer block={block("list", { style: "ordered", items: ["Primero", "Segundo"] })} />);
    expect(screen.getByRole("list").tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
  it("renderiza citas, avisos y separadores", () => {
    const { rerender } = render(<TextBlockRenderer block={block("quote", { text: "La evidencia orienta decisiones.", attribution: "Equipo", source: "Informe" })} />);
    expect(screen.getByText("La evidencia orienta decisiones.").closest("blockquote")).toBeInTheDocument();
    expect(screen.getByText("Equipo", { selector: "cite" })).toBeInTheDocument();
    rerender(<TextBlockRenderer block={block("callout", { tone: "warning", title: "Atención", text: "Revisar el plazo." })} />);
    expect(screen.getByText("Atención")).toBeInTheDocument();
    expect(screen.getByText("Revisar el plazo.")).toBeInTheDocument();
    rerender(<TextBlockRenderer block={block("divider", {})} />);
    expect(document.querySelector("hr")).toBeInTheDocument();
  });
  it("tolera bloques desconocidos o datos inválidos", () => {
    render(<TextBlockRenderer block={block("chart", { labels: [] })} />);
    expect(screen.getByText(/todavía no puede mostrarse/)).toBeInTheDocument();
  });
});
