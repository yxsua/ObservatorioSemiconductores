const fs = require("node:fs/promises");
const path = require("node:path");
const mediaRepository = require("../repositories/media.repository");
const {
    ValidationError,
    ForbiddenError,
    NotFoundError
} = require("../errors/apiError");

const INLINE_MIME_TYPES = new Set([
    "image/avif",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp"
]);

class MediaService {
    parseId(value) {
        const id = Number(value);
        if (!Number.isSafeInteger(id) || id < 1) {
            throw new ValidationError(
                "El identificador del medio no es válido.",
                [{ field: "id", message: "Debe ser un entero positivo." }]
            );
        }
        return id;
    }

    async getInline(rawId) {
        const descriptor = await this.getDescriptor(rawId);
        if (!INLINE_MIME_TYPES.has(descriptor.mimeType)) {
            throw new ForbiddenError(
                "Este medio requiere una descarga autenticada."
            );
        }
        return descriptor;
    }

    async getDownload(rawId) {
        return this.getDescriptor(rawId);
    }

    async getDescriptor(rawId) {
        const id = this.parseId(rawId);
        const row = await mediaRepository.findPublicById(id);
        if (!row) throw new NotFoundError("El medio público no existe.");
        const storage = await this.resolveStorage(row.storage_path);
        return {
            id,
            filename: this.safeFilename(row.original_filename || row.filename, id),
            mimeType: row.mime_type || "application/octet-stream",
            sizeBytes: row.size_bytes === null ? null : Number(row.size_bytes),
            checksum: /^[a-f0-9]{32,128}$/i.test(row.checksum ?? "")
                ? row.checksum : null,
            updatedAt: row.updated_at,
            storage
        };
    }

    async resolveStorage(storagePath) {
        const value = String(storagePath ?? "").trim();
        if (/^https?:\/\//i.test(value)) {
            try {
                const url = new URL(value);
                if (["http:", "https:"].includes(url.protocol)) {
                    return { kind: "remote", url: value };
                }
            } catch {
                // El mismo 404 evita filtrar detalles internos de almacenamiento.
            }
            throw new NotFoundError("El archivo del medio no está disponible.");
        }

        const root = path.resolve(
            process.env.MEDIA_ROOT || path.join(process.cwd(), "storage", "media")
        );
        const candidate = path.resolve(root, value);
        const relative = path.relative(root, candidate);
        if (!value || relative.startsWith("..") || path.isAbsolute(relative)) {
            throw new NotFoundError("El archivo del medio no está disponible.");
        }
        try {
            const stat = await fs.stat(candidate);
            if (!stat.isFile()) throw new Error("not-file");
        } catch {
            throw new NotFoundError("El archivo del medio no está disponible.");
        }
        return { kind: "local", path: candidate };
    }

    safeFilename(value, id) {
        const basename = path.basename(String(value ?? "")).replace(/[\r\n"]/g, "").trim();
        return basename || `media-${id}`;
    }
}

module.exports = new MediaService();
