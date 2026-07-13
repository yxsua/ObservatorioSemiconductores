import { describe, expect, it } from "vitest";
import { signalFormSchema, toSignalInput } from "./signal-form.schema";

const values = {
  title: "Capacidad de prueba",
  summary: "Se amplía la capacidad regional.",
  publicationDate: "2026-07-13",
  evidenceUrl: "https://example.test/evidencia",
  categoryId: "3",
  sourceId: "8",
  signalTypeCode: "TECH",
  impactCode: "HIGH",
  urgencyCode: "MEDIUM",
  reliabilityCode: "HIGH",
  scopeCode: "REGIONAL",
  notes: "Seguimiento trimestral",
  keywordsText: "encapsulado, talento\npruebas"
};

describe("formulario de señales", () => {
  it("convierte campos y palabras clave sin inventar IPS ni estado", () => {
    const parsed = signalFormSchema.parse(values);
    expect(toSignalInput(parsed)).toEqual({
      title: values.title, summary: values.summary, publicationDate: values.publicationDate,
      evidenceUrl: values.evidenceUrl, categoryId: 3, sourceId: 8, signalTypeCode: "TECH",
      impactCode: "HIGH", urgencyCode: "MEDIUM", reliabilityCode: "HIGH", scopeCode: "REGIONAL",
      notes: values.notes, keywords: ["encapsulado", "talento", "pruebas"]
    });
    expect(toSignalInput(parsed)).not.toHaveProperty("ips");
    expect(toSignalInput(parsed)).not.toHaveProperty("status");
  });

  it("rechaza más de veinte palabras clave", () => {
    const result = signalFormSchema.safeParse({ ...values, keywordsText: Array.from({ length: 21 }, (_, index) => `clave-${index}`).join(",") });
    expect(result.success).toBe(false);
  });
});

