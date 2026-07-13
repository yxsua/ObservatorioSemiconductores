const test = require("node:test");
const assert = require("node:assert/strict");
const publicContentService = require("../src/services/publicContent.service");

test("los filtros públicos normalizan códigos y fechas", () => {
    const result = publicContentService.parseFilters({
        type: " report ",
        fcv: "technological",
        categoryId: "4",
        from: "2026-01-01",
        to: "2026-12-31",
        sort: "title"
    });
    assert.deepEqual(result.filters, {
        type: "REPORT",
        fcv: "TECHNOLOGICAL",
        categoryId: 4,
        from: "2026-01-01",
        to: "2026-12-31",
        sortDirection: "ASC",
        sortField: "title"
    });
});

test("la consulta pública no admite filtros internos", () => {
    assert.throws(
        () => publicContentService.parseFilters({ status: "DRAFT" }),
        (error) => error.statusCode === 400
            && error.errors[0].field === "status"
    );
});

test("la consulta pública rechaza intervalos invertidos", () => {
    assert.throws(
        () => publicContentService.parseFilters({
            from: "2026-07-13", to: "2026-07-12"
        }),
        (error) => error.statusCode === 400
            && error.errors[0].field === "from"
    );
});

test("el DTO público elimina metadatos internos de plantilla", () => {
    const section = publicContentService.mapSection({
        id_content_section: "8",
        type_code: "body",
        type_name: "Cuerpo",
        title: "Contenido",
        position: 1,
        is_collapsible: false,
        settings: {
            templateSectionId: 3,
            required: true,
            repeatable: false,
            theme: "wide"
        },
        blocks: []
    });
    assert.deepEqual(section.settings, { theme: "wide" });
    assert.equal("isVisible" in section, false);
});

