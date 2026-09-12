const test = require("node:test");
const assert = require("node:assert/strict");
const trendService = require("../src/services/trend.service");

test("sugiere EMERGING con tres señales y dos fuentes", () => {
    assert.equal(
        trendService.maturitySuggestion({
            signal_count: 3,
            source_count: 2,
            actor_count: 0,first_signal_date:'2026-01-01',last_signal_date:'2026-07-01'
        }).code,
        "EMERGING"
    );
});

test("sugiere CONSOLIDATING con cinco señales y diversidad", () => {
    assert.equal(
        trendService.maturitySuggestion({
            signal_count: 5,
            source_count: 3,
            actor_count: 1,first_signal_date:'2025-01-01',last_signal_date:'2026-01-01'
        }).code,
        "CONSOLIDATING"
    );
});

test("no sugiere madurez con evidencia insuficiente", () => {
    assert.equal(
        trendService.maturitySuggestion({
            signal_count: 2,
            source_count: 2,
            actor_count: 2
        }).code,
        null
    );
});
