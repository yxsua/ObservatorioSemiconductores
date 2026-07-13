const { z } = require("zod");
const contentRepository = require("../repositories/content.repository");
const {
    createContentSchema,
    updateContentSchema,
    createVersionSchema,
    compositionSchema,
    transitionContentSchema
} = require("../schemas/editorial.schema");
const { validateBlock } = require("../editorial/blockRegistry");
const { formatZodErrors } = require("../utils/zod");
const { parsePagination, buildPagination } = require("../utils/pagination");
const {
    ValidationError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InvalidTransitionError,
    ConcurrentModificationError,
    DomainRuleError
} = require("../errors/apiError");

const FILTER_KEYS = new Set([
    "page", "pageSize", "search", "status", "type", "authorId", "sort"
]);
const SORT_FIELDS = new Set(["title", "createdAt", "updatedAt", "publishedAt"]);
const TRANSITION_PERMISSIONS = Object.freeze({
    SUBMIT_FOR_REVIEW: "content:submit",
    REQUEST_CHANGES: "content:approve",
    APPROVE: "content:approve",
    REOPEN: "content:approve",
    PUBLISH: "content:publish",
    ARCHIVE: "content:archive"
});

function parseId(value, field = "id") {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new ValidationError(
            "El identificador no es válido.",
            [{ field, message: "Debe ser un entero positivo." }]
        );
    }
    return id;
}

class ContentService {
    parseFilters(query = {}) {
        const unexpected = Object.keys(query).filter((key) => !FILTER_KEYS.has(key));
        if (unexpected.length) {
            throw new ValidationError(
                "Los filtros editoriales no son válidos.",
                unexpected.map((field) => ({ field, message: "El filtro no está permitido." }))
            );
        }
        const pagination = parsePagination(query);
        const filters = {};
        if (query.search !== undefined) {
            const search = String(query.search).trim();
            if (search.length < 2 || search.length > 200) {
                throw new ValidationError(
                    "Los filtros editoriales no son válidos.",
                    [{ field: "search", message: "Debe contener entre 2 y 200 caracteres." }]
                );
            }
            filters.search = search;
        }
        for (const key of ["status", "type"]) {
            if (query[key] !== undefined) {
                filters[key] = String(query[key]).trim().toUpperCase();
            }
        }
        if (query.authorId !== undefined) filters.authorId = parseId(query.authorId, "authorId");
        const rawSort = query.sort === undefined ? "-updatedAt" : String(query.sort);
        filters.sortDirection = rawSort.startsWith("-") ? "DESC" : "ASC";
        filters.sortField = rawSort.replace(/^-/, "");
        if (!SORT_FIELDS.has(filters.sortField)) {
            throw new ValidationError(
                "Los filtros editoriales no son válidos.",
                [{ field: "sort", message: "El campo de orden no está permitido." }]
            );
        }
        return { filters, pagination };
    }

    async list(query) {
        const { filters, pagination } = this.parseFilters(query);
        const result = await contentRepository.findAll(filters, pagination);
        return {
            items: result.rows.map((row) => this.mapContent(row)),
            pagination: buildPagination(
                pagination.page, pagination.pageSize, result.totalItems
            )
        };
    }

    async getById(rawId, includeComposition = true) {
        const id = parseId(rawId);
        const row = await contentRepository.findById(id);
        if (!row) throw new NotFoundError("El contenido editorial no existe.");
        const content = this.mapContent(row);
        if (includeComposition && row.current_version_id !== null) {
            content.currentVersion = await this.getVersion(id, row.current_version_id);
        }
        return content;
    }

    async create(input, user) {
        const data = this.validate(createContentSchema, input, "Los datos del contenido no son válidos.");
        let composition = null;
        if (data.templateId !== undefined && data.templateId !== null) {
            const template = await contentRepository.findTemplateById(data.templateId);
            if (!template) throw new NotFoundError("La plantilla editorial no existe.");
            if (template.type_code !== data.typeCode) {
                throw new DomainRuleError(
                    "La plantilla no corresponde al tipo de contenido solicitado."
                );
            }
            composition = await this.compositionFromTemplate(template);
        }
        await this.assertMediaExist([data.featuredMediaId].filter(Boolean));
        try {
            const result = await contentRepository.create(data, user.id, composition);
            return this.getById(result.contentId);
        } catch (error) {
            this.handleRepositoryError(error);
        }
    }

    async update(rawId, input) {
        const id = parseId(rawId);
        const data = this.validate(updateContentSchema, input, "Los datos del contenido no son válidos.");
        await this.getById(id, false);
        await this.assertMediaExist([data.featuredMediaId].filter(Boolean));
        try {
            await contentRepository.updateMetadata(id, data);
            return this.getById(id);
        } catch (error) {
            this.handleRepositoryError(error);
        }
    }

    async listVersions(rawId) {
        const id = parseId(rawId);
        await this.getById(id, false);
        const rows = await contentRepository.findVersions(id);
        return rows.map((row) => this.mapVersionSummary(row));
    }

    async getVersion(rawContentId, rawVersionId) {
        const contentId = parseId(rawContentId, "contentId");
        const versionId = parseId(rawVersionId, "versionId");
        const row = await contentRepository.findVersion(contentId, versionId);
        if (!row) throw new NotFoundError("La versión editorial no existe.");
        return this.mapVersion(row);
    }

    async createVersion(rawId, input, user) {
        const id = parseId(rawId);
        const data = this.validate(createVersionSchema, input, "Los datos de la revisión no son válidos.");
        await this.getById(id, false);
        try {
            const versionId = await contentRepository.createVersion(
                id, user.id, data.changeSummary
            );
            return this.getVersion(id, versionId);
        } catch (error) {
            this.handleRepositoryError(error);
        }
    }

    async replaceComposition(rawContentId, rawVersionId, input) {
        const contentId = parseId(rawContentId, "contentId");
        const versionId = parseId(rawVersionId, "versionId");
        const base = this.validate(
            compositionSchema, input, "La composición editorial no es válida."
        );
        const composition = this.validateCompositionBlocks(base);
        await this.assertMediaExist(this.collectMediaIds(composition));
        try {
            await contentRepository.replaceComposition(contentId, versionId, composition);
            return this.getVersion(contentId, versionId);
        } catch (error) {
            this.handleRepositoryError(error);
        }
    }

    async transition(rawId, input, user) {
        const id = parseId(rawId);
        const data = this.validate(
            transitionContentSchema, input, "La transición editorial no es válida."
        );
        const permission = TRANSITION_PERMISSIONS[data.transition];
        if (!(user.permissions ?? []).includes(permission)) {
            throw new ForbiddenError("No tienes permiso para realizar esta transición editorial.");
        }
        try {
            await contentRepository.transition(id, data.transition, user.id, data.notes);
            return this.getById(id);
        } catch (error) {
            if (error.code === "P0001" && /transición/i.test(error.message)) {
                throw new InvalidTransitionError(error.message);
            }
            this.handleRepositoryError(error);
        }
    }

    async history(rawId) {
        const id = parseId(rawId);
        await this.getById(id, false);
        const rows = await contentRepository.findHistory(id);
        return rows.map((row) => ({
            id: Number(row.id_content_status_history),
            version: row.content_version_id === null ? null : {
                id: Number(row.content_version_id),
                number: row.version_number
            },
            fromStatus: row.from_status_code === null ? null : {
                code: row.from_status_code, name: row.from_status
            },
            toStatus: { code: row.to_status_code, name: row.to_status },
            transition: row.transition_code,
            changedBy: { id: Number(row.changed_by), name: row.actor },
            notes: row.notes,
            changedAt: row.changed_at
        }));
    }

    async preview(rawId) {
        const content = await this.getById(rawId);
        return {
            id: content.id,
            slug: content.slug,
            type: content.type,
            status: content.status,
            version: content.currentVersion,
            preview: true
        };
    }

    async listTemplates(query = {}) {
        const unexpected = Object.keys(query).filter((key) => key !== "type");
        if (unexpected.length) {
            throw new ValidationError("Los filtros de plantillas no son válidos.");
        }
        const type = query.type === undefined
            ? null : String(query.type).trim().toUpperCase();
        const rows = await contentRepository.findTemplates(type);
        return rows.map((row) => ({
            id: Number(row.id_template),
            name: row.name,
            description: row.description,
            type: { code: row.type_code, name: row.type },
            sectionCount: Number(row.section_count)
        }));
    }

    async getTemplate(rawId) {
        const id = parseId(rawId, "templateId");
        const template = await contentRepository.findTemplateById(id);
        if (!template) throw new NotFoundError("La plantilla editorial no existe.");
        return this.mapTemplate(template);
    }

    async compositionFromTemplate(template) {
        const sections = template.sections.map((section) => ({
            typeCode: section.type_code ?? "custom",
            title: section.title,
            isCollapsible: false,
            isVisible: true,
            settings: {
                templateSectionId: Number(section.id_template_section),
                required: section.required,
                repeatable: section.repeatable
            },
            blocks: section.blocks
                .filter((block) => block.default_data !== null)
                .map((block) => ({
                    type: block.type_code,
                    schemaVersion: block.schema_version,
                    data: block.default_data,
                    settings: {}
                }))
        }));
        return this.validateCompositionBlocks({
            sections,
            relations: {
                categoryIds: [], signalIds: [], trendIds: [], alertIds: []
            }
        });
    }

    validateCompositionBlocks(composition) {
        const errors = [];
        const sections = composition.sections.map((section, sectionIndex) => ({
            ...section,
            blocks: section.blocks.map((block, blockIndex) => {
                try {
                    return validateBlock(block);
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        error.issues.forEach((issue) => errors.push({
                            field: ["sections", sectionIndex, "blocks", blockIndex, ...issue.path].join("."),
                            message: issue.message
                        }));
                        return null;
                    }
                    throw error;
                }
            }).filter(Boolean)
        }));
        if (errors.length) {
            throw new ValidationError("Los bloques editoriales no son válidos.", errors);
        }
        const relations = {
            ...composition.relations,
            signalIds: [...composition.relations.signalIds],
            trendIds: [...composition.relations.trendIds],
            alertIds: [...composition.relations.alertIds]
        };
        sections.forEach((section) => section.blocks.forEach((block) => {
            const relationField = {
                signal: "signalIds", trend: "trendIds", alert: "alertIds"
            }[block.type];
            if (relationField) relations[relationField].push(block.data.entityId);
        }));
        for (const key of ["signalIds", "trendIds", "alertIds"]) {
            relations[key] = [...new Set(relations[key])];
        }
        return { ...composition, sections, relations };
    }

    collectMediaIds(composition) {
        const ids = [];
        composition.sections.forEach((section) => section.blocks.forEach((block) => {
            if (["image", "file"].includes(block.type)) ids.push(block.data.mediaId);
        }));
        return [...new Set(ids)];
    }

    async assertMediaExist(ids) {
        if (!ids.length) return;
        const existing = new Set(await contentRepository.findExistingMediaIds(ids));
        const missing = ids.filter((id) => !existing.has(id));
        if (missing.length) {
            throw new DomainRuleError(
                "Uno o más archivos multimedia no existen.",
                missing.map((id) => ({ field: "mediaId", message: `No existe el archivo ${id}.` }))
            );
        }
    }

    validate(schema, input, message) {
        const result = schema.safeParse(input);
        if (!result.success) {
            throw new ValidationError(message, formatZodErrors(result.error));
        }
        return result.data;
    }

    handleRepositoryError(error) {
        if (error.applicationCode === "NOT_FOUND") throw new NotFoundError(error.message);
        if (error.applicationCode === "CONCURRENT") {
            throw new ConcurrentModificationError(error.message);
        }
        if (error.applicationCode === "DOMAIN_RULE") throw new DomainRuleError(error.message);
        if (error.code === "23505") throw new ConflictError("El slug editorial ya está en uso.");
        if (error.code === "23503") throw new DomainRuleError("Una relación editorial no existe.");
        if (error.code === "P0001") throw new DomainRuleError(error.message);
        throw error;
    }

    mapContent(row) {
        return {
            id: Number(row.id_content),
            slug: row.slug,
            type: { code: row.type_code, name: row.type },
            status: { code: row.status_code, name: row.status },
            title: row.title,
            summary: row.summary,
            featuredMedia: row.featured_media_id === null ? null : {
                id: Number(row.featured_media_id),
                filename: row.featured_media_filename,
                mimeType: row.featured_media_mime_type
            },
            author: { id: Number(row.author_id), name: row.author },
            currentVersionId: row.current_version_id === null
                ? null : Number(row.current_version_id),
            publishedVersionId: row.published_version_id === null
                ? null : Number(row.published_version_id),
            currentVersionNumber: row.current_version_number,
            approval: row.approved_by === null ? null : {
                by: { id: Number(row.approved_by), name: row.approver },
                at: row.approved_at
            },
            publication: row.published_by === null ? null : {
                by: { id: Number(row.published_by), name: row.publisher },
                at: row.published_at
            },
            archive: row.archived_by === null ? null : {
                by: { id: Number(row.archived_by), name: row.archiver },
                at: row.archived_at
            },
            metrics: {
                versionCount: Number(row.version_count),
                sectionCount: Number(row.section_count),
                blockCount: Number(row.block_count)
            },
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    mapVersionSummary(row) {
        return {
            id: Number(row.id_content_version),
            number: row.version_number,
            title: row.title,
            summary: row.summary,
            changeSummary: row.change_summary,
            createdBy: { id: Number(row.created_by), name: row.creator },
            createdAt: row.created_at,
            approvedBy: row.approved_by === null ? null : {
                id: Number(row.approved_by), name: row.approver
            },
            approvedAt: row.approved_at,
            publishedBy: row.published_by === null ? null : {
                id: Number(row.published_by), name: row.publisher
            },
            publishedAt: row.published_at,
            isCurrent: row.is_current,
            isPublished: row.is_published,
            metrics: {
                sectionCount: Number(row.section_count),
                blockCount: Number(row.block_count)
            }
        };
    }

    mapVersion(row) {
        return {
            id: Number(row.id_content_version),
            number: row.version_number,
            title: row.title,
            summary: row.summary,
            featuredMediaId: row.featured_media_id === null
                ? null : Number(row.featured_media_id),
            changeSummary: row.change_summary,
            createdBy: { id: Number(row.created_by), name: row.creator },
            createdAt: row.created_at,
            approvedBy: row.approved_by === null ? null : {
                id: Number(row.approved_by), name: row.approver
            },
            approvedAt: row.approved_at,
            publishedBy: row.published_by === null ? null : {
                id: Number(row.published_by), name: row.publisher
            },
            publishedAt: row.published_at,
            isCurrent: row.is_current,
            isPublished: row.is_published,
            sections: row.sections.map((section) => ({
                id: Number(section.id_content_section),
                type: section.type_code === null ? null : {
                    code: section.type_code, name: section.type
                },
                title: section.title,
                position: section.position,
                isCollapsible: section.is_collapsible,
                isVisible: section.is_visible,
                settings: section.settings,
                blocks: section.blocks.map((block) => ({
                    id: Number(block.id_content_block),
                    type: { code: block.type_code, name: block.type },
                    schemaVersion: block.schema_version,
                    position: block.position,
                    data: block.data,
                    settings: block.settings,
                    isVisible: block.is_visible,
                    cssClass: block.css_class,
                    createdAt: block.created_at,
                    updatedAt: block.updated_at
                }))
            })),
            relations: {
                categories: row.relations.categories.map((item) => ({
                    id: Number(item.id), name: item.name,
                    fcv: { code: item.fcv_code, name: item.fcv }
                })),
                signals: row.relations.signals.map((item) => this.mapRelated(item)),
                trends: row.relations.trends.map((item) => this.mapRelated(item)),
                alerts: row.relations.alerts.map((item) => this.mapRelated(item))
            }
        };
    }

    mapRelated(item) {
        return {
            id: Number(item.id),
            businessCode: item.business_code,
            title: item.title,
            status: { code: item.status_code, name: item.status }
        };
    }

    mapTemplate(template) {
        return {
            id: Number(template.id_template),
            name: template.name,
            description: template.description,
            type: { code: template.type_code, name: template.type },
            sections: template.sections.map((section) => ({
                id: Number(section.id_template_section),
                type: section.type_code === null ? null : {
                    code: section.type_code, name: section.type
                },
                title: section.title,
                position: section.position,
                required: section.required,
                repeatable: section.repeatable,
                blocks: section.blocks.map((block) => ({
                    id: Number(block.id_template_block),
                    type: { code: block.type_code, name: block.type },
                    schemaVersion: block.schema_version,
                    position: block.position,
                    placeholder: block.placeholder,
                    required: block.required,
                    defaultData: block.default_data,
                    active: block.active
                }))
            }))
        };
    }
}

module.exports = new ContentService();
