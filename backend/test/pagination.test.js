const test = require("node:test");
const assert = require("node:assert/strict");

const {
    parsePagination,
    buildPagination
} = require("../src/utils/pagination");

test("parsePagination aplica los valores predeterminados", () => {
    assert.deepEqual(parsePagination({}), {
        page: 1,
        pageSize: 20,
        limit: 20,
        offset: 0
    });
});

test("parsePagination calcula limit y offset", () => {
    assert.deepEqual(parsePagination({ page: "3", pageSize: "25" }), {
        page: 3,
        pageSize: 25,
        limit: 25,
        offset: 50
    });
});

test("parsePagination rechaza tamaños superiores al máximo", () => {
    assert.throws(
        () => parsePagination({ pageSize: "101" }),
        (error) => error.errorCode === "VALIDATION_ERROR"
    );
});

test("buildPagination representa una colección vacía", () => {
    assert.deepEqual(buildPagination(1, 20, 0), {
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0
    });
});

test("buildPagination redondea el total de páginas hacia arriba", () => {
    assert.deepEqual(buildPagination(2, 20, 41), {
        page: 2,
        pageSize: 20,
        totalItems: 41,
        totalPages: 3
    });
});
