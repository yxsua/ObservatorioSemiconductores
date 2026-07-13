const blockResolverRepository = require("../repositories/blockResolver.repository");

const REFERENCE_FIELDS = Object.freeze({
    compact: { summary: false, metadata: false, relations: false },
    card: { summary: true, metadata: true, relations: false },
    featured: { summary: true, metadata: true, relations: true }
});
const ENTITY_TYPES = new Set(["signal", "trend", "alert"]);
const MEDIA_TYPES = new Set(["image", "file"]);

class BlockResolverService {
    async resolveSections(sections) {
        const references = this.collectReferences(sections);
        const rows = await blockResolverRepository.resolve(references);
        const maps = {
            media: this.toMap(rows.media, "id_media"),
            signal: this.toMap(rows.signals, "id_signal"),
            trend: this.toMap(rows.trends, "id_trend"),
            alert: this.toMap(rows.alerts, "id_alert")
        };

        return sections.map((section) => ({
            ...section,
            blocks: section.blocks.map((block) => {
                const type = block.type_code;
                if (!ENTITY_TYPES.has(type) && !MEDIA_TYPES.has(type)) return block;
                const id = Number(block.data[MEDIA_TYPES.has(type) ? "mediaId" : "entityId"]);
                const source = maps[MEDIA_TYPES.has(type) ? "media" : type].get(id);
                if (!source) return null;
                return {
                    ...block,
                    resolved: MEDIA_TYPES.has(type)
                        ? this.mapMedia(source, type)
                        : this.mapEntity(source, type, block.data)
                };
            }).filter(Boolean)
        })).filter((section) => section.blocks.length > 0);
    }

    collectReferences(sections) {
        const references = {
            mediaIds: new Set(),
            signalIds: new Set(),
            trendIds: new Set(),
            alertIds: new Set()
        };
        sections.forEach((section) => section.blocks.forEach((block) => {
            if (MEDIA_TYPES.has(block.type_code)) {
                references.mediaIds.add(Number(block.data.mediaId));
            } else if (ENTITY_TYPES.has(block.type_code)) {
                references[`${block.type_code}Ids`].add(Number(block.data.entityId));
            }
        }));
        return Object.fromEntries(
            Object.entries(references).map(([key, ids]) => [key, [...ids]])
        );
    }

    toMap(rows, idField) {
        return new Map(rows.map((row) => [Number(row[idField]), row]));
    }

    projectionFor(data) {
        return {
            ...(REFERENCE_FIELDS[data.variant] ?? REFERENCE_FIELDS.card),
            ...(data.fields ?? {})
        };
    }

    mapEntity(row, type, data) {
        const projection = this.projectionFor(data);
        const id = Number(row[`id_${type}`]);
        const entity = {
            kind: type,
            id,
            businessCode: row.business_code,
            title: row.title,
            href: `/api/${type}s/${id}`
        };
        if (projection.summary) entity.summary = row.summary;
        if (projection.metadata) entity.metadata = this.mapMetadata(row, type);
        if (projection.relations) entity.relations = this.mapRelations(row, type);
        return entity;
    }

    mapMetadata(row, type) {
        if (type === "signal") {
            return {
                publicationDate: row.publication_date,
                ips: row.ips === null ? null : Number(row.ips),
                priority: row.priority_code,
                category: {
                    id: Number(row.id_category),
                    name: row.category_name,
                    fcv: { code: row.fcv_code, name: row.fcv_name }
                },
                source: { id: Number(row.id_source), name: row.source_name },
                signalType: {
                    code: row.signal_type_code, name: row.signal_type_name
                },
                impact: { code: row.impact_code, name: row.impact_name },
                urgency: { code: row.urgency_code, name: row.urgency_name },
                reliability: {
                    code: row.reliability_code, name: row.reliability_name
                },
                scope: { code: row.scope_code, name: row.scope_name },
                keywords: row.keywords
            };
        }
        if (type === "trend") {
            return {
                implications: row.implications,
                firstSignalDate: row.first_signal_date,
                lastSignalDate: row.last_signal_date,
                direction: row.direction_code === null ? null : {
                    code: row.direction_code, name: row.direction_name
                },
                maturity: row.maturity_code === null ? null : {
                    code: row.maturity_code, name: row.maturity_name
                },
                metrics: {
                    signalCount: row.signals.length,
                    actorCount: row.actors.length
                }
            };
        }
        return {
            implications: row.implications,
            recommendations: row.recommendations,
            generationDate: row.generation_date,
            publicationDate: row.publication_date,
            responseDeadline: row.response_deadline,
            level: row.level_code === null ? null : {
                code: row.level_code,
                name: row.level_name,
                color: row.level_color
            },
            metrics: {
                signalCount: row.signals.length,
                trendCount: row.trends.length,
                audienceCount: row.audiences.length
            }
        };
    }

    mapRelations(row, type) {
        if (type === "signal") {
            return {
                linkedToTrend: row.linked_to_trend,
                linkedToAlert: row.linked_to_alert
            };
        }
        if (type === "trend") {
            return { signals: row.signals, actors: row.actors };
        }
        return {
            signals: row.signals,
            trends: row.trends,
            audiences: row.audiences
        };
    }

    mapMedia(row, kind) {
        const id = Number(row.id_media);
        return {
            kind,
            id,
            filename: row.filename,
            originalFilename: row.original_filename,
            mimeType: row.mime_type,
            extension: row.extension,
            sizeBytes: row.size_bytes === null ? null : Number(row.size_bytes),
            url: kind === "image" ? `/api/media/${id}` : null,
            downloadUrl: `/api/media/${id}/download`
        };
    }
}

module.exports = new BlockResolverService();
