import { describe, expect, it } from "vitest";
import { alertFormSchema, alertReadiness, toAlertInput, type AlertFormValues } from "./alert-form.schema";

const complete: AlertFormValues = {
  title: "Riesgo de suministro", executiveSummary: "Se requiere seguimiento.",
  implications: "Impacto regional", recommendations: "Diversificar proveedores",
  responseDeadline: "2026-08-01", assessment: {version:"2026-07-21",impact:[3,3,3,3],urgency:[3,3,3,3]},
  activationRule: "Dos señales adicionales", notes: "Uso interno",
  signalIds: ["7"], trendIds: [], audienceCodes: ["GOVERNMENT"]
};

describe("formulario de alertas", () => {
  it("convierte relaciones y textos vacíos al contrato de la API", () => {
    expect(toAlertInput({ ...complete, notes: "", responseDeadline: "" })).toMatchObject({
      signalIds: [7], trendIds: [], audienceCodes: ["GOVERNMENT"],
      notes: null, responseDeadline: null, assessment: {version:"2026-07-21",impact:[3,3,3,3],urgency:[3,3,3,3]}
    });
  });

  it("identifica una alerta lista para revisión", () => {
    expect(alertReadiness(complete).every((item) => item.ready)).toBe(true);
  });

  it("reporta evidencia y audiencia pendientes", () => {
    const pending = alertReadiness({ ...complete, signalIds: [], audienceCodes: [] });
    expect(pending.filter((item) => !item.ready).map((item) => item.label)).toEqual([
      "Al menos una señal o tendencia", "Al menos una audiencia"
    ]);
  });

  it("rechaza fechas de calendario inválidas", () => {
    expect(alertFormSchema.safeParse({ ...complete, responseDeadline: "2026-02-30" }).success).toBe(false);
  });
});
