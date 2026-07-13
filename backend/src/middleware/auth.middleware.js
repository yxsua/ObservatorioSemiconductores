const jwt = require("jsonwebtoken");

const {
    UnauthorizedError
} = require("../errors/ApiError");

const {
    verifyToken
} = require("../utils/jwt");

function authenticate(req, res, next) {
    try {
        const authorizationHeader =
            req.headers.authorization;

        if (!authorizationHeader) {
            throw new UnauthorizedError(
                "Se requiere un token de autenticación."
            );
        }

        const parts = authorizationHeader
            .trim()
            .split(/\s+/);

        if (parts.length !== 2) {
            throw new UnauthorizedError(
                "El token de autenticación tiene un formato inválido."
            );
        }

        const [scheme, token] = parts;

        if (
            scheme.toLowerCase() !== "bearer" ||
            !token
        ) {
            throw new UnauthorizedError(
                "El token de autenticación tiene un formato inválido."
            );
        }

        const payload = verifyToken(token);
        const userId = Number(payload.id);

        if (
            !Number.isSafeInteger(userId) ||
            userId <= 0
        ) {
            throw new UnauthorizedError(
                "El token no contiene un usuario válido."
            );
        }

        req.user = {
            id: userId,
            email: payload.email ?? null
        };

        return next();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            return next(error);
        }

        /*
         * NotBeforeError debe comprobarse antes que
         * JsonWebTokenError para conservar el mensaje específico.
         */
        if (error instanceof jwt.TokenExpiredError) {
            return next(
                new UnauthorizedError(
                    "El token de autenticación ha expirado."
                )
            );
        }

        if (error instanceof jwt.NotBeforeError) {
            return next(
                new UnauthorizedError(
                    "El token de autenticación todavía no es válido."
                )
            );
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return next(
                new UnauthorizedError(
                    "El token de autenticación no es válido."
                )
            );
        }

        return next(error);
    }
}

module.exports = {
    authenticate
};