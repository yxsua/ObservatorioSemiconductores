const jwt = require("jsonwebtoken");

function getJwtSecret() {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error(
            "La variable de entorno JWT_SECRET no está configurada."
        );
    }

    return jwtSecret;
}

function getJwtExpiration() {
    return process.env.JWT_EXPIRES_IN || "24h";
}

/**
 * Genera un token JWT.
 *
 * @param {Object} payload
 * @returns {string}
 */
function generateToken(payload) {
    return jwt.sign(
        payload,
        getJwtSecret(),
        {
            expiresIn: getJwtExpiration(),
            algorithm: "HS256"
        }
    );
}

/**
 * Verifica y decodifica un token JWT.
 *
 * @param {string} token
 * @returns {Object}
 */
function verifyToken(token) {
    return jwt.verify(
        token,
        getJwtSecret(),
        {
            algorithms: ["HS256"]
        }
    );
}

module.exports = {
    generateToken,
    verifyToken
};