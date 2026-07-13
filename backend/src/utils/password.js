const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

/**
 * Genera el hash de una contraseña.
 *
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compara una contraseña con su hash.
 *
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

module.exports = {
    hashPassword,
    comparePassword
};