const publicViewRepository = require("../repositories/publicView.repository");
const { NotFoundError, ValidationError } = require("../errors/apiError");

const RESOURCE_TYPES = new Set(["content", "signal", "trend", "alert"]);

function parse(resourceType, rawId) {
    const type = String(resourceType ?? "").toLowerCase();
    const id = Number(rawId);
    if (!RESOURCE_TYPES.has(type)) {
        throw new ValidationError("El tipo de recurso no es válido.");
    }
    if (!Number.isSafeInteger(id) || id < 1) {
        throw new ValidationError("El identificador del recurso no es válido.");
    }
    return { type, id };
}

async function assertPublic(type, id) {
    if (!await publicViewRepository.isPublic(type, id)) {
        throw new NotFoundError("El recurso no existe o no está disponible públicamente.");
    }
}

async function get(resourceType, rawId) {
    const { type, id } = parse(resourceType, rawId);
    await assertPublic(type, id);
    return { resourceType: type, resourceId: id, viewCount: await publicViewRepository.get(type, id) };
}

async function increment(resourceType, rawId) {
    const { type, id } = parse(resourceType, rawId);
    await assertPublic(type, id);
    return { resourceType: type, resourceId: id, viewCount: await publicViewRepository.increment(type, id) };
}

module.exports = { get, increment };
