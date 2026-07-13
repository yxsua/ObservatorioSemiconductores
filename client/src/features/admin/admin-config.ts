import type { AdminEntityKind, TransitionOption } from "./types";

export interface AdminEntityConfig {
  kind: AdminEntityKind;
  singular: string;
  plural: string;
  route: string;
  readPermission: string;
  createPermission: string;
  defaultSort: string;
  statuses: ReadonlyArray<{ code: string; name: string }>;
}

const COMMON_STATUSES = [
  { code: "NEW", name: "Nueva" },
  { code: "UNDER_REVIEW", name: "En revisión" },
  { code: "VALIDATED", name: "Validada" }
] as const;

export const ADMIN_CONFIG: Record<AdminEntityKind, AdminEntityConfig> = {
  signals: { kind: "signals", singular: "señal", plural: "Señales", route: "senales", readPermission: "signals:read-internal", createPermission: "signals:create", defaultSort: "-updatedAt", statuses: [...COMMON_STATUSES, { code: "ARCHIVED", name: "Archivada" }] },
  trends: { kind: "trends", singular: "tendencia", plural: "Tendencias", route: "tendencias", readPermission: "trends:read-internal", createPermission: "trends:create", defaultSort: "-updatedAt", statuses: [...COMMON_STATUSES, { code: "ACTIVE", name: "Activa" }, { code: "ARCHIVED", name: "Archivada" }] },
  alerts: { kind: "alerts", singular: "alerta", plural: "Alertas", route: "alertas", readPermission: "alerts:read-internal", createPermission: "alerts:create", defaultSort: "-updatedAt", statuses: [...COMMON_STATUSES, { code: "PUBLISHED", name: "Publicada" }, { code: "CLOSED", name: "Cerrada" }] }
};

const option = (code: string, label: string, description: string, permission: string, tone?: "danger" | "primary"): TransitionOption => ({ code, label, description, permission, tone });

export function transitionsFor(kind: AdminEntityKind, status: string): TransitionOption[] {
  if (kind === "signals") {
    if (status === "NEW") return [option("SUBMIT_FOR_REVIEW", "Enviar a revisión", "Bloquea la edición y solicita validación.", "signals:submit", "primary"), option("ARCHIVE", "Archivar", "Retira la señal del flujo activo.", "signals:archive", "danger")];
    if (status === "UNDER_REVIEW") return [option("REQUEST_CHANGES", "Solicitar cambios", "Devuelve la señal a captura.", "signals:validate"), option("VALIDATE", "Validar", "Autoriza su consulta pública.", "signals:validate", "primary"), option("ARCHIVE", "Archivar", "Retira la señal del flujo activo.", "signals:archive", "danger")];
    if (status === "VALIDATED") return [option("REOPEN", "Reabrir", "Solicita una nueva revisión.", "signals:validate"), option("ARCHIVE", "Archivar", "Retira la señal de consulta pública.", "signals:archive", "danger")];
    return [];
  }
  if (kind === "trends") {
    if (status === "NEW") return [option("SUBMIT_FOR_REVIEW", "Enviar a revisión", "Comprueba evidencia y metodología.", "trends:submit", "primary"), option("ARCHIVE", "Archivar", "Retira la tendencia del flujo.", "trends:archive", "danger")];
    if (status === "UNDER_REVIEW") return [option("REQUEST_CHANGES", "Solicitar cambios", "Devuelve la tendencia a análisis.", "trends:validate"), option("VALIDATE", "Validar", "Confirma la revisión metodológica.", "trends:validate", "primary"), option("ARCHIVE", "Archivar", "Retira la tendencia del flujo.", "trends:archive", "danger")];
    if (status === "VALIDATED") return [option("ACTIVATE", "Activar", "Publica la tendencia en el portal.", "trends:activate", "primary"), option("REOPEN", "Reabrir", "Solicita una nueva revisión.", "trends:validate"), option("ARCHIVE", "Archivar", "Retira la tendencia del flujo.", "trends:archive", "danger")];
    if (status === "ACTIVE") return [option("REOPEN", "Reabrir", "Retira la tendencia mientras se revisa.", "trends:validate"), option("ARCHIVE", "Archivar", "Retira definitivamente la tendencia.", "trends:archive", "danger")];
    return [];
  }
  if (status === "NEW") return [option("SUBMIT_FOR_REVIEW", "Enviar a revisión", "Comprueba evidencia, audiencia y campos requeridos.", "alerts:submit", "primary")];
  if (status === "UNDER_REVIEW") return [option("REQUEST_CHANGES", "Solicitar cambios", "Devuelve la alerta a preparación.", "alerts:validate"), option("VALIDATE", "Validar", "Confirma la revisión independiente.", "alerts:validate", "primary")];
  if (status === "VALIDATED") return [option("PUBLISH", "Publicar", "Hace visible la alerta en el portal.", "alerts:publish", "primary"), option("REOPEN", "Reabrir", "Solicita una nueva validación.", "alerts:validate")];
  if (status === "PUBLISHED") return [option("CLOSE", "Cerrar", "Conserva la alerta como registro histórico.", "alerts:close", "primary"), option("REOPEN", "Reabrir", "Retira la alerta mientras se revisa.", "alerts:validate")];
  return [];
}
