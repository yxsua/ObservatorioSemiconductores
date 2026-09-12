import type { components } from "@/api/schema";
import type { AdminEntity, AdminEntityKind, AdminEntityView, AdminFact } from "./types";
import {signalAssessmentSchema,alertAssessmentSchema} from '@/features/assessment/assessment';

type Signal = components["schemas"]["Signal"];
type Trend = components["schemas"]["Trend"];
type Alert = components["schemas"]["Alert"];

function name(value: unknown) {
  if (!value || typeof value !== "object" || !("name" in value)) return null;
  return typeof value.name === "string" ? value.name : null;
}

function person(value: unknown) {
  return name(value);
}

function fact(label: string, value: string | number | null | undefined): AdminFact | null {
  return value === null || value === undefined || value === "" ? null : { label, value: String(value) };
}

export function toAdminEntityView(kind: AdminEntityKind, entity: AdminEntity): AdminEntityView {
  if (kind === "signals") {
    const signal = entity as Signal;
    const assessment=signalAssessmentSchema.safeParse((entity as Signal & {assessment?:unknown}).assessment);
    return {
      ...(assessment.success?{assessment:{kind:'signal' as const,value:assessment.data}}:{}),
      id: signal.id, businessCode: signal.businessCode, title: signal.title, description: signal.summary,
      status: signal.status, updatedAt: signal.updatedAt, owner: person(signal.analyst),
      facts: [fact("IPS", `${signal.ips}/27`), fact("Prioridad", signal.priority), fact("Categoría", signal.category.name), fact("Fuente", signal.source.name), fact("Impacto", signal.impact.name), fact("Confiabilidad", signal.reliability.name)].filter((value): value is AdminFact => Boolean(value)),
      evidenceUrl: signal.evidenceUrl,
      keywords: signal.keywords.map((keyword) => keyword.name),
      internalNotes: signal.notes
    };
  }
  if (kind === "trends") {
    const trend = entity as Trend;
    return {
      id: trend.id, businessCode: trend.businessCode, title: trend.title, description: trend.narrative,
      status: trend.status, updatedAt: trend.updatedAt, owner: person(trend.analyst),
      facts: [fact("Dirección", name(trend.direction)), fact("Madurez", name(trend.maturity)), fact("Señales", trend.metrics.signalCount), fact("Fuentes", trend.metrics.sourceCount), fact("Actores", trend.metrics.actorCount), fact("FCV", trend.metrics.fcvCount)].filter((value): value is AdminFact => Boolean(value))
    };
  }
  const alert = entity as Alert;
  const assessment=alertAssessmentSchema.safeParse((entity as Alert & {assessment?:unknown}).assessment);
  const alertSignals = alert.signals as Array<{ statusCode?: string }>;
  const alertTrends = alert.trends as Array<{ statusCode?: string }>;
  const validEvidence = alertSignals.every((item) => item.statusCode === "VALIDATED")
    && alertTrends.every((item) => ["VALIDATED", "ACTIVE"].includes(item.statusCode ?? ""));
  return {
    ...(assessment.success?{assessment:{kind:'alert' as const,value:assessment.data}}:{}),
    id: alert.id, businessCode: alert.businessCode, title: alert.title, description: alert.executiveSummary,
    status: alert.status, updatedAt: alert.updatedAt, owner: person(alert.creator),
    facts: [fact("Nivel", name(alert.level)), fact("Origen", alert.origin.name), fact("Señales", alert.metrics.signalCount), fact("Tendencias", alert.metrics.trendCount), fact("Audiencias", alert.metrics.audienceCount), fact("Fecha límite", alert.responseDeadline)].filter((value): value is AdminFact => Boolean(value)),
    internalNotes: alert.notes,
    requirements: [
      { label: "Nivel asignado", ready: Boolean(alert.level) },
      { label: "Implicaciones", ready: Boolean(alert.implications?.trim()) },
      { label: "Recomendaciones", ready: Boolean(alert.recommendations?.trim()) },
      { label: "Regla de activación", ready: Boolean(alert.activationRule?.trim()) },
      { label: "Evidencia relacionada", ready: alert.metrics.signalCount + alert.metrics.trendCount > 0 && validEvidence },
      { label: "Audiencia relacionada", ready: alert.metrics.audienceCount > 0 }
    ]
  };
}
