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
            "UNAUTHORIZED"
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
            "FORBIDDEN"
        );
    }
}

class NotFoundError extends ApiError {
    constructor(message = "Recurso no encontrado.") {
        super(
            message,
            404,
            null,
            "NOT_FOUND"
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

module.exports = {
    ApiError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError
};