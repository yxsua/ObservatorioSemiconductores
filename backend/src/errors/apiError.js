class ApiError extends Error {
    constructor(
        message,
        statusCode = 500,
        errors = null,
        errorCode = null
    ) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errors = errors;
        this.errorCode = errorCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends ApiError {
    constructor(
        message = "Los datos proporcionados no son válidos.",
        errors = null
    ) {
        super(
            message,
            400,
            errors,
            "VALIDATION_ERROR"
        );
    }
}

class UnauthorizedError extends ApiError {
    constructor(message = "No autorizado.") {
        super(
            message,
            401,
            null,
            "AUTHENTICATION_REQUIRED"
        );
    }
}

class ForbiddenError extends ApiError {
    constructor(
        message = "No tienes permiso para realizar esta acción."
    ) {
        super(
            message,
            403,
            null,
            "PERMISSION_DENIED"
        );
    }
}

class NotFoundError extends ApiError {
    constructor(message = "Recurso no encontrado.") {
        super(
            message,
            404,
            null,
            "RESOURCE_NOT_FOUND"
        );
    }
}

class ConflictError extends ApiError {
    constructor(message = "El recurso ya existe.") {
        super(
            message,
            409,
            null,
            "CONFLICT"
        );
    }
}

class InvalidTransitionError extends ApiError {
    constructor(message = "La transición solicitada no está permitida.") {
        super(message, 409, null, "INVALID_TRANSITION");
    }
}

class ConcurrentModificationError extends ApiError {
    constructor(message = "El recurso fue modificado por otra operación.") {
        super(message, 409, null, "CONCURRENT_MODIFICATION");
    }
}

class DomainRuleError extends ApiError {
    constructor(
        message = "La operación incumple una regla de dominio.",
        errors = null
    ) {
        super(message, 422, errors, "DOMAIN_RULE_VIOLATION");
    }
}

module.exports = {
    ApiError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InvalidTransitionError,
    ConcurrentModificationError,
    DomainRuleError
};
