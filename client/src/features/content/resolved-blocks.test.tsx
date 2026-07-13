import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { ImageBlock } from "./MediaBlocks";
import { ReferenceBlock } from "./ReferenceBlock";
import {
  parseResolvedFile,
  parseResolvedImage,
  parseResolvedReference
} from "./resolved-blocks";

const signalResolved = {
  kind: "signal", id: 9, businessCode: "SIG-2026-0009", title: "Nueva capacidad regional",
  href: "/api/signals/9", summary: "La capacidad de prueba aumenta.",
  metadata: { priority: "HIGH", ips: 23, publicationDate: "2026-07-10", category: { name: "Empaque" }, source: { name: "Fuente pública" } },
  relations: { linkedToTrend: true, linkedToAlert: false }
};

afterEach(cleanup);

describe("resolución segura de referencias editoriales", () => {
  it.each(["compact", "card", "featured"] as const)("valida y representa la variante %s", (variant) => {
    const reference = parseResolvedReference("signal", { entityId: 9, variant }, signalResolved);
    expect(reference).not.toBeNull();
    render(<MemoryRouter><ReferenceBlock reference={reference!} /></MemoryRouter>);
    expect(screen.getByLabelText("Señal: Nueva capacidad regional")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nueva capacidad regional" })).toHaveAttribute("href", "/senales/9");
    if (variant === "compact") expect(screen.queryByText("La capacidad de prueba aumenta.")).toBeInTheDocument();
    if (variant === "card") expect(screen.getByText("23/27")).toBeInTheDocument();
    if (variant === "featured") expect(screen.getByText("Vinculada a una tendencia")).toBeInTheDocument();
  });

  it("rechaza inconsistencias sin usar entityId para reconstruir contenido", () => {
    expect(parseResolvedReference("signal", { entityId: 10, variant: "card" }, signalResolved)).toBeNull();
    expect(parseResolvedReference("trend", { entityId: 9, variant: "card" }, signalResolved)).toBeNull();
    expect(parseResolvedReference("signal", { entityId: 9, variant: "card" }, { ...signalResolved, href: "https://evil.test/9" })).toBeNull();
    expect(parseResolvedReference("signal", { entityId: 9, variant: "unknown" }, signalResolved)).toBeNull();
  });
});

describe("medios editoriales resueltos", () => {
  it("renderiza una imagen pública con alt, pie y enlace HTTP seguro", () => {
    const image = parseResolvedImage(
      { mediaId: 4, alt: "Laboratorio de encapsulado", caption: "Instalaciones regionales", linkUrl: "https://example.test/informe" },
      { kind: "image", id: 4, filename: "laboratorio.webp", originalFilename: null, mimeType: "image/webp", extension: "webp", sizeBytes: 2048, url: "/api/media/4", downloadUrl: "/api/media/4/download" }
    );
    expect(image).not.toBeNull();
    render(<ImageBlock image={image!} />);
    expect(screen.getByRole("img", { name: "Laboratorio de encapsulado" })).toHaveAttribute("src", "/api/media/4");
    expect(screen.getByText("Instalaciones regionales", { selector: "figcaption" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /abre un sitio externo/ })).toHaveAttribute("rel", "noreferrer");
  });

  it("rechaza medios no coincidentes, URL arbitrarias y tipos inline inseguros", () => {
    const resolved = { kind: "image", id: 4, filename: "archivo.svg", originalFilename: null, mimeType: "image/svg+xml", extension: "svg", sizeBytes: 50, url: "/api/media/4", downloadUrl: "/api/media/4/download" };
    expect(parseResolvedImage({ mediaId: 4, alt: "Ilustración" }, resolved)).toBeNull();
    expect(parseResolvedImage({ mediaId: 5, alt: "Ilustración" }, { ...resolved, mimeType: "image/png" })).toBeNull();
    expect(parseResolvedImage({ mediaId: 4, alt: "Ilustración", linkUrl: "javascript:alert(1)" }, { ...resolved, mimeType: "image/png" })).toBeNull();
  });

  it("valida archivos sin exponerlos como contenido inline", () => {
    const file = parseResolvedFile(
      { mediaId: 7, label: "Reporte técnico", description: "Documento completo" },
      { kind: "file", id: 7, filename: "reporte.pdf", originalFilename: "Reporte 2026.pdf", mimeType: "application/pdf", extension: "pdf", sizeBytes: 2048, url: null, downloadUrl: "/api/media/7/download" }
    );
    expect(file).toMatchObject({ id: 7, label: "Reporte técnico", downloadUrl: "/api/media/7/download" });
    expect(parseResolvedFile({ mediaId: 7, label: "Reporte" }, { ...file, url: "/api/media/7" })).toBeNull();
  });
});
