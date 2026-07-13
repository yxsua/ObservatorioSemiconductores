const pool = require("../config/database");

const CATALOGS = Object.freeze({
    "source-types": {
        view: "vw_source_types",
        orderBy: "name"
    },
    categories: {
        view: "vw_categories",
        orderBy: "fcv, name",
        where: "active = TRUE"
    },
    fcv: {
        view: "vw_fcv",
        orderBy: "name",
        where: "active = TRUE"
    },
    "block-types": {
        view: "vw_block_types",
        orderBy: "name",
        where: "active = TRUE"
    },
    "signal-types": {
        view: "vw_signal_types",
        orderBy: "id_signal_type"
    },
    "reliability-levels": {
        view: "vw_reliability_levels",
        orderBy: "weight"
    },
    impacts: {
        view: "vw_impacts",
        orderBy: "weight"
    },
    urgencies: {
        view: "vw_urgencies",
        orderBy: "weight"
    },
    scopes: {
        view: "vw_scopes",
        orderBy: "id_scope"
    },
    "signal-statuses": {
        view: "vw_signal_statuses",
        orderBy: "id_signal_status"
    },
    "trend-maturity": {
        view: "vw_trend_maturity",
        orderBy: "id_trend_maturity"
    },
    "trend-statuses": {
        view: "vw_trend_statuses",
        orderBy: "id_trend_status"
    },
    "trend-directions": {
        view: "vw_trend_directions",
        orderBy: "id_trend_direction"
    },
    "alert-levels": {
        view: "vw_alert_levels",
        orderBy: "id_alert_level"
    },
    "alert-statuses": {
        view: "vw_alert_statuses",
        orderBy: "id_alert_status"
    },
    "alert-origins": {
        view: "vw_alert_origins",
        orderBy: "id_alert_origin"
    },
    audiences: {
        view: "vw_audiences",
        orderBy: "name"
    },
    "content-types": {
        view: "vw_content_types",
        orderBy: "name"
    },
    "content-statuses": {
        view: "vw_content_statuses",
        orderBy: "id_content_status"
    },
    "file-types": {
        view: "vw_file_types",
        orderBy: "name"
    },
    "actor-types": {
        view: "vw_actor_types",
        orderBy: "name"
    },
    "content-relation-types": {
        view: "vw_content_relation_types",
        orderBy: "name"
    },
    "section-types": {
        view: "vw_section_types",
        orderBy: "name"
    }
});

class CatalogRepository {
    getCatalogNames() {
        return Object.keys(CATALOGS);
    }

    hasCatalog(catalogName) {
        return Object.hasOwn(CATALOGS, catalogName);
    }

    async findAll(catalogName) {
        const catalog = CATALOGS[catalogName];

        if (!catalog) {
            return null;
        }

        const whereClause = catalog.where
            ? `WHERE ${catalog.where}`
            : "";

        const query = `
            SELECT *
            FROM ${catalog.view}
            ${whereClause}
            ORDER BY ${catalog.orderBy};
        `;

        const { rows } = await pool.query(query);

        return rows;
    }
}

module.exports = new CatalogRepository();
