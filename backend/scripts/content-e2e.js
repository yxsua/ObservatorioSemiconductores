/* eslint-disable no-console */

const fs = require("node:fs/promises");
const path = require("node:path");
const pool = require("../src/config/database");

const baseUrl = process.env.API_URL || "http://localhost:3001";
const password = process.env.E2E_PASSWORD || "Password123!";

async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
        method: options.method || "GET",
        headers: {
            "content-type": "application/json",
            ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
            ...(options.headers ?? {})
        },
        redirect: options.redirect,
        body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    const payload = options.responseType === "buffer"
        ? Buffer.from(await response.arrayBuffer())
        : await response.json().catch(() => ({}));
    if (options.expected !== undefined && response.status !== options.expected) {
        throw new Error(
            `${options.method || "GET"} ${path}: esperaba ${options.expected}, `
            + `recibió ${response.status} ${JSON.stringify(payload)}`
        );
    }
    return { status: response.status, payload, headers: response.headers };
}

async function register(email, firstName, lastName) {
    await request("/api/auth/register", {
        method: "POST",
        body: { firstName, lastName, email, password, termsVersion:"2026-09-11" },
        expected: 201
    });
}

async function login(email) {
    const result = await request("/api/auth/login", {
        method: "POST",
        body: { email, password },
        expected: 200
    });
    return result.payload.data.token;
}

async function assignRole(email, role) {
    await pool.query(`
        INSERT INTO user_roles (id_user, id_role)
        SELECT users.id_user, roles.id_role
        FROM users CROSS JOIN roles
        WHERE users.email = $1 AND roles.name = $2
        ON CONFLICT DO NOTHING;
    `, [email, role]);
}

async function seedTemplate() {
    const result = await pool.query(`
        INSERT INTO content_templates (content_type_id, name, description)
        SELECT id_content_type, 'Reporte E2E', 'Plantilla de regresión editorial'
        FROM content_types WHERE code = 'REPORT'
        RETURNING id_template;
    `);
    const templateId = result.rows[0].id_template;
    const section = await pool.query(`
        INSERT INTO template_sections (
            template_id, section_type_id, title, position, required, repeatable
        )
        SELECT $1, id_section_type, 'Resumen', 1, TRUE, FALSE
        FROM section_types WHERE code = 'summary'
        RETURNING id_template_section;
    `, [templateId]);
    await pool.query(`
        INSERT INTO template_blocks (
            template_section_id, block_type_id, position,
            placeholder, required, default_data
        )
        SELECT $1, id_block_type, 1, 'Escriba el resumen', TRUE,
            '{"text":"Resumen inicial","format":"plain"}'::jsonb
        FROM block_type WHERE code = 'paragraph';
    `, [section.rows[0].id_template_section]);
    return Number(templateId);
}

async function seedResolvedReferences(editorEmail, publisherEmail, suffix) {
    const source = await pool.query(`
        INSERT INTO sources (id_source_type, name, website, reliability)
        SELECT id_source_type, 'Fuente resolución E2E',
            'https://example.com/source', 0.95
        FROM source_types WHERE code = 'SCIENTIFIC_ARTICLE'
        RETURNING id_source;
    `);
    const users = await pool.query(`
        SELECT
            MAX(id_user) FILTER (WHERE email = $1) AS editor_id,
            MAX(id_user) FILTER (WHERE email = $2) AS publisher_id
        FROM users;
    `, [editorEmail, publisherEmail]);
    const signal = await pool.query(`
        SELECT sp_create_signal_v2(
            $3,
            'Resumen público de la señal resuelta.',
            CURRENT_DATE,
            'https://example.com/evidence',
            1::SMALLINT,
            $1,
            'STRONG', 'HIGH', 'HIGH', 'HIGH', 'GLOBAL',
            $2
        ) AS id_signal;
    `, [source.rows[0].id_source, users.rows[0].editor_id, `Señal resuelta desde contenido ${suffix}`]);
    const signalId = Number(signal.rows[0].id_signal);
    await pool.query("SELECT sp_transition_signal($1,'SUBMIT_FOR_REVIEW',$2,NULL);", [
        signalId, users.rows[0].editor_id
    ]);
    await pool.query("SELECT sp_transition_signal($1,'VALIDATE',$2,NULL);", [
        signalId, users.rows[0].publisher_id
    ]);
    const mediaRoot = process.env.MEDIA_ROOT
        || path.join(process.cwd(), "storage", "media");
    await fs.mkdir(mediaRoot, { recursive: true });
    const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z8Z8AAAAASUVORK5CYII=",
        "base64"
    );
    await fs.writeFile(path.join(mediaRoot, "resolved-e2e.png"), png);
    const media = await pool.query(`
        INSERT INTO media (
            filename, original_filename, mime_type, extension,
            storage_path, size_bytes, is_public
        ) VALUES (
            'resolved-e2e.png', 'imagen-original.png', 'image/png', 'png',
            'resolved-e2e.png', $1, TRUE
        ) RETURNING id_media;
    `, [png.length]);
    const fileMedia = await pool.query(`
        INSERT INTO media (
            filename, original_filename, mime_type, extension,
            storage_path, size_bytes, is_public
        ) VALUES (
            'resolved-e2e.pdf', 'reporte-e2e.pdf', 'application/pdf', 'pdf',
            'https://cdn.example.com/resolved-e2e.pdf', 4096, TRUE
        ) RETURNING id_media;
    `);
    return {
        signalId,
        mediaId: Number(media.rows[0].id_media),
        fileMediaId: Number(fileMedia.rows[0].id_media),
        publisherId: Number(users.rows[0].publisher_id)
    };
}

async function transition(id, transitionCode, token, expected = 200) {
    return request(`/api/admin/content/${id}/transitions`, {
        method: "POST",
        token,
        body: { transition: transitionCode },
        expected
    });
}

async function main() {
    const suffix = `${Date.now()}-${process.pid}`;
    const title = `Reporte editorial E2E ${suffix}`;
    const editorEmail = `editor-content-${suffix}@example.com`;
    const publisherEmail = `publisher-content-${suffix}@example.com`;
    const memberEmail = `member-export-${suffix}@example.com`;
    await register(editorEmail, "Elena", "Editora");
    await register(publisherEmail, "Pablo", "Publicador");
    await register(memberEmail, "Mario", "Miembro");
    await assignRole(editorEmail, "EDITOR");
    await assignRole(publisherEmail, "PUBLISHER");
    const references = await seedResolvedReferences(editorEmail, publisherEmail, suffix);
    const templateId = await seedTemplate();
    const editor = await login(editorEmail);
    const publisher = await login(publisherEmail);
    const member = await login(memberEmail);

    await request("/api/admin/content", { expected: 401 });
    const templates = await request("/api/admin/content-templates", {
        token: editor, expected: 200
    });
    if (!templates.payload.data.some((item) => item.id === templateId)) {
        throw new Error("La plantilla sembrada no fue devuelta por la API.");
    }

    const created = await request("/api/admin/content", {
        method: "POST",
        token: editor,
        expected: 201,
        body: {
            typeCode: "REPORT",
            title,
            summary: "Versión inicial del reporte.",
            slug: `reporte-editorial-api-e2e-${suffix}`,
            templateId
        }
    });
    let content = created.payload.data;
    const contentId = content.id;
    const firstVersionId = content.currentVersionId;
    if (content.status.code !== "DRAFT" || content.currentVersion.sections.length !== 1) {
        throw new Error("La plantilla no creó una versión DRAFT con composición.");
    }

    const publicBeforePublish = await request(`/api/content?search=${suffix}`, { expected: 200 });
    if (publicBeforePublish.payload.data.items.length !== 0) {
        throw new Error("La lista pública expuso contenido DRAFT.");
    }
    await request(`/api/content/${content.slug}`, { expected: 404 });
    await request(`/api/views/content/${contentId}`, { expected: 404 });
    await request(`/api/views/content/${contentId}`, { method: "POST", expected: 404 });

    const updated = await request(`/api/admin/content/${contentId}`, {
        method: "PATCH",
        token: editor,
        expected: 200,
        body: {
            typeCode: "REPORT",
            summary: "Resumen actualizado antes de componer.",
            updatedAt: content.updatedAt
        }
    });
    content = updated.payload.data;
    const beforeComposition = content.updatedAt;

    const composition = {
        updatedAt: beforeComposition,
        sections: [{
            typeCode: "body",
            title: "Desarrollo",
            blocks: [
                {
                    type: "heading",
                    schemaVersion: 1,
                    data: { text: "Panorama", level: 2 }
                },
                {
                    type: "paragraph",
                    schemaVersion: 1,
                    data: { text: "Contenido editorial validado.", format: "plain" }
                },
                {
                    type: "chart",
                    schemaVersion: 1,
                    data: {
                        chartType: "bar",
                        labels: ["2025", "2026"],
                        series: [{ name: "Capacidad", values: [10, 15] }]
                    }
                },
                {
                    type: "signal",
                    schemaVersion: 1,
                    data: {
                        entityId: references.signalId,
                        variant: "featured",
                        fields: { summary: false }
                    }
                },
                {
                    type: "image",
                    schemaVersion: 1,
                    data: {
                        mediaId: references.mediaId,
                        alt: "Imagen resuelta"
                    }
                },
                {
                    type: "file",
                    schemaVersion: 1,
                    data: {
                        mediaId: references.fileMediaId,
                        label: "Reporte descargable"
                    }
                },
                {
                    type: "paragraph",
                    schemaVersion: 1,
                    data: { text: "Bloque privado", format: "plain" },
                    isVisible: false
                }
            ]
        }, {
            typeCode: "body",
            title: "Sección privada",
            isVisible: false,
            blocks: [{
                type: "paragraph",
                schemaVersion: 1,
                data: { text: "Sección no publicable", format: "plain" }
            }]
        }]
    };
    await request(
        `/api/admin/content/${contentId}/versions/${firstVersionId}/composition`,
        { method: "PUT", token: editor, body: composition, expected: 200 }
    );
    await request(
        `/api/admin/content/${contentId}/versions/${firstVersionId}/composition`,
        { method: "PUT", token: editor, body: composition, expected: 409 }
    );

    const preview = await request(`/api/admin/content/${contentId}/preview`, {
        token: editor, expected: 200
    });
    if (
        preview.payload.data.version.sections.length !== 2
        || preview.payload.data.version.sections[0].blocks.length !== 7
    ) {
        throw new Error("La vista previa no contiene la composición guardada.");
    }

    await transition(contentId, "SUBMIT_FOR_REVIEW", editor);
    await request(
        `/api/admin/content/${contentId}/versions/${firstVersionId}/composition`,
        { method: "PUT", token: editor, body: { sections: [] }, expected: 422 }
    );
    await transition(contentId, "APPROVE", editor, 403);
    await transition(contentId, "APPROVE", publisher);
    const published = await transition(contentId, "PUBLISH", publisher);
    content = published.payload.data;
    if (content.status.code !== "PUBLISHED" || content.publishedVersionId !== firstVersionId) {
        throw new Error("La publicación no fijó la versión aprobada.");
    }

    const viewsBefore = await request(`/api/views/content/${contentId}`, { expected: 200 });
    if (viewsBefore.payload.data.viewCount !== 0) throw new Error("Contador inicial incorrecto.");
    await Promise.all(Array.from({ length: 5 }, () => request(`/api/views/content/${contentId}`, {
        method: "POST", expected: 200
    })));
    const viewsAfter = await request(`/api/views/content/${contentId}`, { expected: 200 });
    if (viewsAfter.payload.data.viewCount !== 5) throw new Error("El contador perdió incrementos concurrentes.");

    const publicList = await request(`/api/content?type=report&search=${suffix}`, {
        expected: 200
    });
    if (
        publicList.payload.data.items.length !== 1
        || publicList.payload.data.items[0].slug !== content.slug
    ) {
        throw new Error("La publicación no apareció en la lista pública filtrada.");
    }
    const publicPublished = await request(`/api/content/${content.slug}`, {
        expected: 200
    });
    if (
        publicPublished.payload.data.versionNumber !== 1
        || publicPublished.payload.data.sections.length !== 1
        || publicPublished.payload.data.sections[0].blocks.length !== 6
    ) {
        throw new Error("La consulta pública expuso composición oculta o incorrecta.");
    }
    const publicBlocks = publicPublished.payload.data.sections[0].blocks;
    const resolvedSignal = publicBlocks.find((block) => block.type.code === "signal");
    const resolvedImage = publicBlocks.find((block) => block.type.code === "image");
    const resolvedFile = publicBlocks.find((block) => block.type.code === "file");
    if (
        resolvedSignal?.resolved?.title !== `Señal resuelta desde contenido ${suffix}`
        || resolvedSignal.resolved.metadata.priority !== "HIGH"
        || resolvedSignal.resolved.relations.linkedToTrend !== false
        || "summary" in resolvedSignal.resolved
        || resolvedImage?.resolved?.url !== `/api/media/${references.mediaId}`
        || resolvedImage.resolved.sizeBytes < 1
        || resolvedFile?.resolved?.url !== null
        || resolvedFile.resolved.downloadUrl
            !== `/api/media/${references.fileMediaId}/download`
    ) {
        throw new Error("Los bloques públicos no se resolvieron según su contrato.");
    }
    const inlineImage = await request(`/api/media/${references.mediaId}`, {
        expected: 200
    });
    if (
        !inlineImage.headers.get("content-type")?.startsWith("image/png")
        || inlineImage.headers.get("x-content-type-options") !== "nosniff"
    ) {
        throw new Error("La imagen pública no se entregó con cabeceras seguras.");
    }
    const imageRange = await request(`/api/media/${references.mediaId}`, {
        headers: { range: "bytes=0-9" },
        expected: 206
    });
    if (!imageRange.headers.get("content-range")?.startsWith("bytes 0-9/")) {
        throw new Error("La entrega local no respetó el rango HTTP solicitado.");
    }
    await request(`/api/media/${references.fileMediaId}`, { expected: 403 });
    await request(`/api/media/${references.mediaId}/download`, { expected: 401 });
    const imageDownload = await request(`/api/media/${references.mediaId}/download`, {
        token: editor,
        expected: 200
    });
    if (!imageDownload.headers.get("content-disposition")?.startsWith("attachment;")) {
        throw new Error("La descarga local no utilizó Content-Disposition attachment.");
    }
    const remoteDownload = await request(
        `/api/media/${references.fileMediaId}/download`,
        { token: editor, expected: 302, redirect: "manual" }
    );
    if (remoteDownload.headers.get("location")
        !== "https://cdn.example.com/resolved-e2e.pdf") {
        throw new Error("La descarga remota autenticada no resolvió su ubicación.");
    }

    await request("/api/exports/content.csv", { expected: 401 });
    await request("/api/exports/content.csv?page=1", {
        token: member, expected: 400
    });
    const contentExport = await request(
        `/api/exports/content.csv?type=report&search=${suffix}`,
        { token: member, expected: 200, responseType: "buffer" }
    );
    const exportedCsv = contentExport.payload.toString("utf8");
    if (
        contentExport.payload[0] !== 0xEF
        || !contentExport.headers.get("content-type")?.startsWith("text/csv")
        || !contentExport.headers.get("content-disposition")
            ?.startsWith("attachment; filename=\"observatorio-content-")
        || contentExport.headers.get("x-row-count") !== "1"
        || contentExport.headers.get("x-checksum-sha256")?.length !== 64
        || !exportedCsv.includes("Reporte editorial E2E")
    ) {
        throw new Error("La exportación CSV no respetó su contrato.");
    }
    const signalExport = await request(`/api/exports/signals.json?search=${suffix}`, {
        token: member, expected: 200, responseType: "buffer"
    });
    const exportedSignals = JSON.parse(signalExport.payload.toString("utf8"));
    if (
        exportedSignals.resource !== "signals"
        || exportedSignals.rowCount !== 1
        || exportedSignals.data[0].id !== references.signalId
        || "analyst" in exportedSignals.data[0]
        || "notes" in exportedSignals.data[0]
    ) {
        throw new Error("La exportación JSON rompió la frontera pública.");
    }
    const memberHistory = await request("/api/exports/history", {
        token: member, expected: 200
    });
    const editorHistory = await request("/api/exports/history", {
        token: editor, expected: 200
    });
    if (
        memberHistory.payload.data.items.length !== 2
        || editorHistory.payload.data.items.length !== 0
        || memberHistory.payload.data.items
            .some((entry) => entry.checksum.length !== 64)
    ) {
        throw new Error("El historial de exportaciones no quedó aislado por usuario.");
    }

    await pool.query("SELECT sp_transition_signal($1,'REOPEN',$2,NULL);", [
        references.signalId, references.publisherId
    ]);
    const publicAfterWithdrawal = await request(`/api/content/${content.slug}`, {
        expected: 200
    });
    if (
        publicAfterWithdrawal.payload.data.sections[0].blocks
            .some((block) => block.type.code === "signal")
        || publicAfterWithdrawal.payload.data.relations.signals.length !== 0
    ) {
        throw new Error("Una referencia retirada permaneció resuelta públicamente.");
    }

    await request(`/api/admin/content/${contentId}`, {
        method: "PATCH",
        token: editor,
        body: { title: "Mutación indebida" },
        expected: 422
    });

    const revision = await request(`/api/admin/content/${contentId}/versions`, {
        method: "POST",
        token: editor,
        expected: 201,
        body: { changeSummary: "Segunda edición" }
    });
    const secondVersionId = revision.payload.data.id;
    const current = await request(`/api/admin/content/${contentId}`, {
        token: editor, expected: 200
    });
    if (
        current.payload.data.status.code !== "DRAFT"
        || current.payload.data.currentVersionId !== secondVersionId
        || current.payload.data.publishedVersionId !== firstVersionId
        || current.payload.data.publication === null
        || current.payload.data.publication.by.id === undefined
    ) {
        throw new Error(
            "La revisión reemplazó o perdió la atribución de la publicación vigente."
        );
    }

    await request(`/api/admin/content/${contentId}`, {
        method: "PATCH",
        token: editor,
        expected: 200,
        body: { title: "Título aún no publicado" }
    });
    const publicDuringRevision = await request(`/api/content/${content.slug}`, {
        expected: 200
    });
    const searchDuringRevision = await request('/api/search?q=' + encodeURIComponent('Título aún no publicado'), {expected:200});
    if (searchDuringRevision.payload.data.items.some((item) => item.type === 'content' && item.id === contentId)) {
        throw new Error('La búsqueda expuso el título de una revisión no publicada.');
    }
    if (
        publicDuringRevision.payload.data.title !== title
        || publicDuringRevision.payload.data.versionNumber !== 1
        || "currentVersionId" in publicDuringRevision.payload.data
        || "author" in publicDuringRevision.payload.data
        || "approval" in publicDuringRevision.payload.data
    ) {
        throw new Error("La consulta pública filtró datos de la revisión interna.");
    }

    const history = await request(`/api/admin/content/${contentId}/history`, {
        token: editor, expected: 200
    });
    if (history.payload.data.length !== 5) {
        throw new Error(`Historial inesperado: ${history.payload.data.length}`);
    }

    console.log(JSON.stringify({
        templateId,
        contentId,
        publishedVersionId: firstVersionId,
        currentVersionId: secondVersionId,
        history: history.payload.data.map((entry) => entry.transition),
        negativeChecks: [
            "unauthenticated-list=401",
            "stale-composition=409",
            "edit-under-review=422",
            "editor-approve=403",
            "edit-published=422",
            "draft-public-detail=404"
        ],
        publicChecks: [
            "draft-not-listed",
            "hidden-composition-filtered",
            "published-pointer-stable-during-revision",
            "internal-metadata-omitted",
            "reference-blocks-resolved",
            "withdrawn-reference-fails-closed",
            "public-image-streamed",
            "downloads-authenticated",
            "local-range-supported"
        ],
        exportChecks: [
            "member-only",
            "csv-utf8-download",
            "json-public-boundary",
            "forbidden-pagination",
            "per-user-history"
        ]
    }, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}).finally(async () => {
    await pool.end();
});
