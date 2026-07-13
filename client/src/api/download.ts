import { apiResponse, type ApiRequestOptions } from "./client";

export interface ApiDownload {
  blob: Blob;
  filename: string;
  exportId: number | null;
  rowCount: number | null;
  checksum: string | null;
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseContentDispositionFilename(value: string | null) {
  if (!value) return null;
  const extended = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  const basic = value.match(/filename\s*=\s*(?:"([^"]+)"|([^;\s]+))/i);
  const filename = extended
    ? safeDecode(extended[1].trim())
    : basic?.[1] ?? basic?.[2] ?? null;
  return filename?.replace(/[\\/]/g, "_") ?? null;
}

function parseIntegerHeader(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export async function apiDownload(
  path: string,
  fallbackFilename: string,
  options: ApiRequestOptions = {}
): Promise<ApiDownload> {
  const { data, response } = await apiResponse<Blob>(path, {
    ...options,
    responseType: "blob"
  });
  return {
    blob: data,
    filename: parseContentDispositionFilename(
      response.headers.get("content-disposition")
    ) || fallbackFilename,
    exportId: parseIntegerHeader(response.headers.get("x-export-id")),
    rowCount: parseIntegerHeader(response.headers.get("x-row-count")),
    checksum: response.headers.get("x-checksum-sha256")
  };
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
