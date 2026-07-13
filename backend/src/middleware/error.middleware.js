const {
    ApiError
} = require("../errors/ApiError");

/**
 * Middleware global de manejo de errores.
 *
 * Debe registrarse después de todas las rutas.
 */
function errorHandler(error, req, res, next) {
    let statusCode = error.statusCode ?? 500;

    let message =
        error.message ??
        "Ocurrió un error interno en el servidor.";

    let code =
        error.errorCode ??
        "INTERNAL_SERVER_ERROR";

    let errors = error.errors ?? null;

    /*
     * JSON inválido recibido mediante express.json().
     */
    if (
        error instanceof SyntaxError &&
        error.status === 400 &&
        "body" in error
    ) {
        statusCode = 400;
        message =
            "El cuerpo de la petición contiene un JSON inválido.";
        code = "INVALID_JSON";
        errors = null;
    }

    /*
     * PostgreSQL: unique_violation.
     */
    if (error.code === "23505") {
        statusCode = 409;
        message =
            "Ya existe un registro con los datos proporcionados.";
        code = "CONFLICT";
        errors = null;
    }

    /*
     * PostgreSQL: foreign_key_violation.
     */
    if (error.code === "23503") {
        statusCode = 409;
        message =
            "La operación hace referencia a un recurso inexistente.";
        code = "FOREIGN_KEY_CONFLICT";
        errors = null;
    }

    /*
     * PostgreSQL: invalid_text_representation.
     */
    if (error.code === "22P02") {
        statusCode = 400;
        message =
            "Uno de los valores proporcionados tiene un formato inválido.";
        code = "INVALID_VALUE";
        errors = null;
    }

    const isProduction =
        process.env.NODE_ENV === "production";

    const isOperationalError =
        error instanceof ApiError ||
        error.isOperational === true;

    if (isProduction && !isOperationalError) {
        statusCode = 500;
        message =
            "Ocurrió un error interno en el servidor.";
        code = "INTERNAL_SERVER_ERROR";
        errors = null;
    }

    console.error({
        message: error.message,
        name: error.name,
        technicalCode: error.code,
        publicCode: error.errorCode,
        statusCode,
        method: req.method,
        path: req.originalUrl,
        stack: error.stack
    });

    const response = {
        success: false,
        message,
        code,
        errors
    };

    if (!isProduction && !isOperationalError) {
        response.stack = error.stack;
    }

    return res.status(statusCode).json(response);
}

module.exports = {
    errorHandler
};