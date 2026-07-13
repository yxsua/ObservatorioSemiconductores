import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { isApiError, saveBlob } from "@/api";
import { useAuth } from "@/features/auth/AuthContext";
import { compatibleExportFilters, countExportFilters } from "./export-filters";
import { downloadPublicExport } from "./exports.service";
import type { ExportFormat, ExportResource } from "./types";
import styles from "./Exports.module.css";

const RESOURCE_LABELS: Record<ExportResource, string> = {
  signals: "señales",
  trends: "tendencias",
  alerts: "alertas",
  content: "contenido"
};

export function ExportActions({ filters: sourceFilters, resource }: { filters: object; resource: ExportResource }) {
  const auth = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState<ExportFormat | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const filters = compatibleExportFilters(resource, sourceFilters);
  const activeFilters = countExportFilters(filters);
  const returnTo = location.pathname + location.search;
  const canDownload = auth.status === "authenticated" && auth.hasPermission("exports:download");

  async function download(format: ExportFormat) {
    if (!auth.token) return;
    setDownloading(format);
    setMessage(null);
    try {
      const result = await downloadPublicExport(resource, format, filters, auth.token);
      saveBlob(result.blob, result.filename);
      setMessage({ tone: "success", text: result.rowCount === null
        ? `Exportación lista: ${result.filename}.`
        : `Exportación lista: ${result.rowCount} registros en ${result.filename}.` });
      await queryClient.invalidateQueries({ queryKey: ["export-history"] });
    } catch (error) {
      const text = isApiError(error) && error.status === 422
        ? `${error.message} Aplica filtros más específicos e inténtalo nuevamente.`
        : isApiError(error)
          ? error.message
          : "No fue posible generar la exportación.";
      setMessage({ tone: "error", text });
    } finally {
      setDownloading(null);
    }
  }

  return (
    <aside aria-label={`Exportar ${RESOURCE_LABELS[resource]}`} className={styles.actions}>
      <div><strong>Exportar resultados</strong><p>{activeFilters > 0 ? `Se aplicarán ${activeFilters} ${activeFilters === 1 ? "filtro compatible" : "filtros compatibles"}.` : "Se exportará la colección pública completa."}</p></div>
      {canDownload ? (
        <div className={styles.actionButtons}>
          <button disabled={downloading !== null} onClick={() => void download("csv")} type="button">{downloading === "csv" ? "Preparando CSV…" : "Descargar CSV"}</button>
          <button disabled={downloading !== null} onClick={() => void download("json")} type="button">{downloading === "json" ? "Preparando JSON…" : "Descargar JSON"}</button>
        </div>
      ) : auth.status === "anonymous" ? (
        <div className={styles.accountLinks}><Link state={{ returnTo }} to="/iniciar-sesion">Iniciar sesión</Link><Link state={{ returnTo }} to="/registro">Crear cuenta</Link></div>
      ) : auth.status === "restoring" ? <span className={styles.pending}>Comprobando acceso…</span> : <span className={styles.pending}>Tu cuenta no permite exportar.</span>}
      {message && <p className={message.tone === "error" ? styles.error : styles.success} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p>}
    </aside>
  );
}
