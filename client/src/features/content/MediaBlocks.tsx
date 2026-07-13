import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiDownload, isApiError, saveBlob } from "@/api";
import { useAuth } from "@/features/auth/AuthContext";
import { resolvedDownloadApiPath, type ResolvedFileBlock, type ResolvedImageBlock } from "./resolved-blocks";
import styles from "./ResolvedBlocks.module.css";

export function ImageBlock({ image }: { image: ResolvedImageBlock }) {
  const visual = <img alt={image.alt} decoding="async" loading="lazy" src={image.url} />;
  return (
    <figure className={styles.imageBlock}>
      {image.linkUrl
        ? <a aria-label={`${image.alt} (abre un sitio externo)`} href={image.linkUrl} rel="noreferrer" target="_blank">{visual}</a>
        : visual}
      {image.caption && <figcaption>{image.caption}</figcaption>}
    </figure>
  );
}

function formatBytes(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: value < 1024 * 1024 ? 0 : 1,
    style: "unit",
    unit: value < 1024 * 1024 ? "kilobyte" : "megabyte",
    unitDisplay: "short"
  }).format(value / (value < 1024 * 1024 ? 1024 : 1024 * 1024));
}

export function FileBlock({ file }: { file: ResolvedFileBlock }) {
  const auth = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState<"idle" | "downloading">("idle");
  const [error, setError] = useState<string | null>(null);
  const details = [file.extension?.toLocaleUpperCase("es-MX"), formatBytes(file.sizeBytes)].filter(Boolean).join(" · ");
  const returnTo = location.pathname + location.search;

  async function download() {
    const path = resolvedDownloadApiPath(file.downloadUrl);
    if (!path || !auth.token) return;
    setError(null);
    setStatus("downloading");
    try {
      const result = await apiDownload(path, file.originalFilename || file.filename, { token: auth.token });
      saveBlob(result.blob, result.filename);
    } catch (downloadError) {
      setError(isApiError(downloadError) ? downloadError.message : "No fue posible descargar el archivo.");
    } finally {
      setStatus("idle");
    }
  }

  const canDownload = auth.status === "authenticated" && auth.hasPermission("exports:download");
  return (
    <aside aria-label={`Archivo: ${file.label}`} className={styles.fileBlock}>
      <div aria-hidden="true" className={styles.fileIcon}>↓</div>
      <div className={styles.fileBody}>
        <p className={styles.fileLabel}>{file.label}</p>
        {file.description && <p className={styles.fileDescription}>{file.description}</p>}
        {details && <p className={styles.fileDetails}>{details}</p>}
        {error && <p className={styles.fileError} role="alert">{error}</p>}
      </div>
      {canDownload
        ? <button className={styles.downloadAction} disabled={status === "downloading"} onClick={() => void download()} type="button">{status === "downloading" ? "Descargando…" : "Descargar archivo"}</button>
        : auth.status === "anonymous"
          ? <Link className={styles.downloadAction} state={{ returnTo }} to="/iniciar-sesion">Inicia sesión para descargar</Link>
          : auth.status === "restoring"
            ? <span className={styles.downloadPending}>Comprobando acceso…</span>
            : <span className={styles.downloadPending}>Tu cuenta no permite descargar este archivo.</span>}
    </aside>
  );
}
