const pool = require("../config/database");

class AuthRepository {
    /**
     * Crea un nuevo usuario.
     *
     * @param {Object} user
     * @returns {Promise<Object>}
     */
    async createUser(user) {
        const query = `
            INSERT INTO users (
                first_name,
                last_name,
                email,
                password_hash
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id_user,
                first_name,
                last_name,
                email,
                occupation,
                active,
                created_at;
        `;

        const values = [
            user.firstName,
            user.lastName,
            user.email,
            user.passwordHash
        ];

        const { rows } = await pool.query(query, values);

        return rows[0];
    }

    /**
     * Busca un usuario por correo.
     * Se utiliza durante el inicio de sesión.
     *
     * @param {string} email
     * @returns {Promise<Object|null>}
     */
    async findUserByEmail(email) {
        const query = `
            SELECT
                id_user,
                first_name,
                last_name,
                email,
                occupation,
                password_hash,
                active
            FROM users
            WHERE email = $1
            LIMIT 1;
        `;

        const { rows } = await pool.query(query, [email]);

        return rows[0] ?? null;
    }

    /**
     * Obtiene un usuario por su identificador.
     * Se utiliza en GET /auth/me.
     *
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    async findUserById(id) {
        const query = `
            SELECT
                id_user,
                first_name,
                last_name,
                email,
                occupation,
                active,
                last_login,
                created_at
            FROM users
            WHERE id_user = $1
            LIMIT 1;
        `;

        const { rows } = await pool.query(query, [id]);

        return rows[0] ?? null;
    }

    /**
     * Actualiza la fecha del último inicio de sesión.
     *
     * @param {number} id
     * @returns {Promise<void>}
     */
    async updateLastLogin(id) {
        const query = `
            UPDATE users
            SET last_login = NOW()
            WHERE id_user = $1;
        `;

        await pool.query(query, [id]);
    }
}

module.exports = new AuthRepository();