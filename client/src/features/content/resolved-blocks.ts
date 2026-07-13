type RecordValue = Record<string, unknown>;

export type ReferenceKind = "signal" | "trend" | "alert";
export type ReferenceVariant = "compact" | "card" | "featured";

export interface ResolvedReferenceBlock {
  kind: ReferenceKind;
  id: number;
  businessCode: string;
  title: string;
  href: string;
  publicHref: string;
  variant: ReferenceVariant;
  summary: string | null;
  metadata: RecordValue | null;
  relations: RecordValue | null;
}

interface ResolvedMedia {
  id: number;
  filename: string;
  originalFilename: string | null;
  mimeType: string | null;
  extension: string | null;
  sizeBytes: number | null;
  downloadUrl: string;
}

export interface ResolvedImageBlock extends ResolvedMedia {
  kind: "image";
  url: string;
  alt: string;
  caption: string | null;
  linkUrl: string | null;
}

export interface ResolvedFileBlock extends ResolvedMedia {
  kind: "file";
  label: string;
  description: string | null;
}

const REFERENCE_KINDS = new Set<ReferenceKind>(["signal", "trend", "alert"]);
const REFERENCE_VARIANTS = new Set<ReferenceVariant>(["compact", "card", "featured"]);
const PUBLIC_ROUTES: Record<ReferenceKind, string> = {
  signal: "senales",
  trend: "tendencias",
  alert: "alertas"
};
const INLINE_IMAGE_MIMES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

function record(value: unknown): RecordValue | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as RecordValue;
}

function positiveInteger(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

function requiredText(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
}

function optionalText(value: unknown, max: number) {
  if (value === undefined || value === null) return null;
  return requiredText(value, max);
}

function nullableMetadata(value: unknown) {
  if (value === undefined || value === null) return null;
  return record(value);
}

function safeHttpUrl(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.length > 2000) return null;
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function mediaBase(data: RecordValue, resolved: RecordValue, kind: "image" | "file") {
  const dataId = positiveInteger(data.mediaId);
  const id = positiveInteger(resolved.id);
  if (!dataId || dataId !== id || resolved.kind !== kind) return null;
  const filename = requiredText(resolved.filename, 500);
  const downloadUrl = requiredText(resolved.downloadUrl, 1000);
  if (!filename || downloadUrl !== `/api/media/${id}/download`) return null;

  const originalFilename = optionalText(resolved.originalFilename, 500);
  const mimeType = optionalText(resolved.mimeType, 200);
  const extension = optionalText(resolved.extension, 30);
  const sizeBytes = resolved.sizeBytes === null
    ? null
    : typeof resolved.sizeBytes === "number"
      && Number.isSafeInteger(resolved.sizeBytes)
      && resolved.sizeBytes >= 0
      ? resolved.sizeBytes
      : null;
  if (resolved.sizeBytes !== null && sizeBytes === null) return null;

  return { id, filename, originalFilename, mimeType, extension, sizeBytes, downloadUrl };
}

export function parseResolvedReference(
  blockType: string,
  dataValue: unknown,
  resolvedValue: unknown
): ResolvedReferenceBlock | null {
  const data = record(dataValue);
  const resolved = record(resolvedValue);
  if (!data || !resolved || !REFERENCE_KINDS.has(blockType as ReferenceKind)) return null;

  const kind = resolved.kind;
  const variant = data.variant;
  const dataId = positiveInteger(data.entityId);
  const id = positiveInteger(resolved.id);
  if (
    typeof kind !== "string"
    || !REFERENCE_KINDS.has(kind as ReferenceKind)
    || kind !== blockType
    || typeof variant !== "string"
    || !REFERENCE_VARIANTS.has(variant as ReferenceVariant)
    || !dataId
    || dataId !== id
  ) return null;

  const typedKind = kind as ReferenceKind;
  const businessCode = requiredText(resolved.businessCode, 100);
  const title = requiredText(resolved.title, 500);
  const href = requiredText(resolved.href, 1000);
  const expectedHref = `/api/${typedKind}s/${id}`;
  if (!businessCode || !title || href !== expectedHref) return null;

  const summary = optionalText(resolved.summary, 20000);
  if (resolved.summary !== undefined && resolved.summary !== null && !summary) return null;
  const metadata = nullableMetadata(resolved.metadata);
  const relations = nullableMetadata(resolved.relations);
  if (resolved.metadata !== undefined && resolved.metadata !== null && !metadata) return null;
  if (resolved.relations !== undefined && resolved.relations !== null && !relations) return null;

  return {
    kind: typedKind,
    id,
    businessCode,
    title,
    href,
    publicHref: `/${PUBLIC_ROUTES[typedKind]}/${id}`,
    variant: variant as ReferenceVariant,
    summary,
    metadata,
    relations
  };
}

export function parseResolvedImage(dataValue: unknown, resolvedValue: unknown): ResolvedImageBlock | null {
  const data = record(dataValue);
  const resolved = record(resolvedValue);
  if (!data || !resolved) return null;
  const base = mediaBase(data, resolved, "image");
  const alt = requiredText(data.alt, 300);
  const caption = optionalText(data.caption, 1000);
  const linkUrl = safeHttpUrl(data.linkUrl);
  if (!base || !alt) return null;
  if (data.caption !== undefined && data.caption !== null && !caption) return null;
  if (data.linkUrl !== undefined && data.linkUrl !== null && !linkUrl) return null;
  if (!base.mimeType || !INLINE_IMAGE_MIMES.has(base.mimeType)) return null;
  const url = requiredText(resolved.url, 1000);
  if (url !== `/api/media/${base.id}`) return null;
  return { ...base, kind: "image", url, alt, caption, linkUrl };
}

export function parseResolvedFile(dataValue: unknown, resolvedValue: unknown): ResolvedFileBlock | null {
  const data = record(dataValue);
  const resolved = record(resolvedValue);
  if (!data || !resolved) return null;
  const base = mediaBase(data, resolved, "file");
  const label = requiredText(data.label, 250);
  const description = optionalText(data.description, 1000);
  if (!base || !label || resolved.url !== null) return null;
  if (data.description !== undefined && data.description !== null && !description) return null;
  return { ...base, kind: "file", label, description };
}

export function resolvedDownloadApiPath(value: string) {
  return /^\/api\/media\/\d+\/download$/.test(value)
    ? value.slice("/api".length)
    : null;
}

export function nestedRecord(source: RecordValue | null, key: string) {
  return source ? record(source[key]) : null;
}

export function nestedText(source: RecordValue | null, key: string) {
  return source ? optionalText(source[key], 2000) : null;
}

export function nestedNumber(source: RecordValue | null, key: string) {
  const value = source?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function nestedBoolean(source: RecordValue | null, key: string) {
  const value = source?.[key];
  return typeof value === "boolean" ? value : null;
}

export function nestedCount(source: RecordValue | null, key: string) {
  const value = source?.[key];
  return Array.isArray(value) ? value.length : null;
}
