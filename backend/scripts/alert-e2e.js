/* eslint-disable no-console */

const baseUrl = process.env.API_URL || "http://localhost:3001";
const password = process.env.E2E_PASSWORD || "Password123!";

async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
        method: options.method || "GET",
        headers: {
            "content-type": "application/json",
            ...(options.token
                ? { authorization: `Bearer ${options.token}` }
                : {})
        },
        body: options.body === undefined
            ? undefined
            : JSON.stringify(options.body)
    });

    const payload = await response.json().catch(() => ({}));
    if (options.expected !== undefined && response.status !== options.expected) {
        throw new Error(
            `${options.method || "GET"} ${path}: esperaba ${options.expected}, `
            + `recibió ${response.status} ${JSON.stringify(payload)}`
        );
    }

    return { status: response.status, payload };
}

async function login(email) {
    const result = await request("/api/auth/login", {
        method: "POST",
        body: { email, password },
        expected: 200
    });
    return result.payload.data.token;
}

async function transition(resource, id, transitionCode, token, expected = 200) {
    return request(`/api/admin/${resource}/${id}/transitions`, {
        method: "POST",
        body: { transition: transitionCode },
        token,
        expected
    });
}

async function createValidatedSignals(analyst, validator) {
    const ids = [];

    for (let index = 1; index <= 3; index += 1) {
        const result = await request("/api/admin/signals", {
            method: "POST",
            token: analyst,
            expected: 201,
            body: {
                title: `Señal E2E ${index}`,
                summary: "Evidencia técnica independiente para validar el flujo integral.",
                publicationDate: "2026-07-01",
                evidenceUrl: `https://example.com/evidence-${index}`,
                categoryId: 1,
                sourceId: index === 2 ? 2 : 1,
                signalTypeCode: "STRONG",
                impactCode: "HIGH",
                urgencyCode: "HIGH",
                reliabilityCode: "HIGH",
                scopeCode: "GLOBAL",
                keywords: ["semiconductores", "e2e"]
            }
        });
        const id = result.payload.data.id;
        ids.push(id);
        await transition("signals", id, "SUBMIT_FOR_REVIEW", analyst);
        await transition("signals", id, "VALIDATE", validator);
    }

    return ids;
}

async function createActiveTrend(signalIds, analyst, validator) {
    const result = await request("/api/admin/trends", {
        method: "POST",
        token: analyst,
        expected: 201,
        body: {
            title: "Tendencia E2E",
            narrative: "Convergencia verificable de señales procedentes de fuentes independientes.",
            implications: "Cambio estructural relevante para el ecosistema.",
            directionCode: "INCREASING",
            maturityCode: "EMERGING",
            signalIds
        }
    });
    const id = result.payload.data.id;
    await transition("trends", id, "SUBMIT_FOR_REVIEW", analyst);
    await transition("trends", id, "VALIDATE", validator);
    await transition("trends", id, "ACTIVATE", validator);
    return id;
}

async function main() {
    const analyst = await login("analyst@example.com");
    const validator = await login("validator@example.com");
    const publisher = await login("publisher@example.com");
    const signalIds = await createValidatedSignals(analyst, validator);
    const trendId = await createActiveTrend(signalIds, analyst, validator);

    const incomplete = await request("/api/admin/alerts", {
        method: "POST",
        token: analyst,
        expected: 201,
        body: {
            title: "Alerta incompleta E2E",
            executiveSummary: "Caso que debe fallar al enviar a revisión.",
            implications: "Impacto.",
            recommendations: "Atender.",
            levelCode: "YELLOW",
            activationRule: "Regla de prueba."
        }
    });
    await transition(
        "alerts",
        incomplete.payload.data.id,
        "SUBMIT_FOR_REVIEW",
        analyst,
        422
    );

    const created = await request("/api/admin/alerts", {
        method: "POST",
        token: analyst,
        expected: 201,
        body: {
            title: "Alerta E2E de suministro",
            executiveSummary: "Riesgo respaldado por señales validadas y una tendencia activa.",
            implications: "Podría afectar capacidad y plazos de entrega.",
            recommendations: "Diversificar proveedores y monitorear inventarios.",
            responseDeadline: "2026-12-31",
            levelCode: "ORANGE",
            activationRule: "Activar si dos fuentes independientes confirman la disrupción.",
            notes: "Nota interna no pública.",
            signalIds: [signalIds[0]],
            trendIds: [trendId],
            audienceCodes: ["INDUSTRY", "GOVERNMENT"]
        }
    });
    const alertId = created.payload.data.id;

    await request(`/api/alerts/${alertId}`, { expected: 404 });
    await transition("alerts", alertId, "SUBMIT_FOR_REVIEW", analyst);
    await transition("alerts", alertId, "VALIDATE", analyst, 403);
    await transition("alerts", alertId, "VALIDATE", validator);
    await transition("alerts", alertId, "PUBLISH", publisher);

    const published = await request(`/api/alerts/${alertId}`, { expected: 200 });
    const publicAlert = published.payload.data;
    if (
        publicAlert.notes !== undefined
        || publicAlert.creator !== undefined
        || publicAlert.status.code !== "PUBLISHED"
        || publicAlert.metrics.signalCount !== 1
        || publicAlert.metrics.trendCount !== 1
        || publicAlert.metrics.audienceCount !== 2
    ) {
        throw new Error(`Proyección pública inválida: ${JSON.stringify(publicAlert)}`);
    }

    await transition("alerts", alertId, "CLOSE", validator);
    const closed = await request(`/api/alerts/${alertId}`, { expected: 200 });
    if (closed.payload.data.status.code !== "CLOSED") {
        throw new Error("La alerta cerrada dejó de estar disponible públicamente.");
    }

    const history = await request(`/api/admin/alerts/${alertId}/history`, {
        token: validator,
        expected: 200
    });
    if (history.payload.data.length !== 5) {
        throw new Error(
            `Se esperaban 5 entradas de historial y se recibieron ${history.payload.data.length}.`
        );
    }

    console.log(JSON.stringify({
        signalIds,
        trendId,
        alertId,
        publicStatus: closed.payload.data.status.code,
        history: history.payload.data.map((entry) => entry.transition),
        negativeChecks: [
            "submit-without-evidence-or-audience=422",
            "analyst-validate=403",
            "pre-publication-detail=404"
        ]
    }, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
