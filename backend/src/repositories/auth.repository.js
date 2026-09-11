const pool = require("../config/database");

class AuthRepository {
    /**
     * Crea un nuevo usuario.
     *
     * @param {Object} user
     * @returns {Promise<Object>}
     */
    async createUser(user) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const userResult = await client.query(
                `
                    INSERT INTO users (
                        first_name,
                        last_name,
                        email,
                        password_hash, terms_version, terms_accepted_at
                    )
                    VALUES ($1, $2, $3, $4, $5, now())
                    RETURNING
                        id_user,
                        first_name,
                        last_name,
                        email,
                        occupation,
                        active,
                        created_at;
                `,
                [
                    user.firstName,
                    user.lastName,
                    user.email,
                    user.passwordHash, user.termsVersion
                ]
            );

            const createdUser = userResult.rows[0];

            const roleResult = await client.query(
                `
                    INSERT INTO user_roles (id_user, id_role)
                    SELECT $1, id_role
                    FROM roles
                    WHERE name = 'MEMBER'
                    RETURNING id_role;
                `,
                [createdUser.id_user]
            );

            if (roleResult.rowCount !== 1) {
                throw new Error(
                    "El rol MEMBER no está configurado en la base de datos."
                );
            }

            await client.query("COMMIT");

            return createdUser;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
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
                u.id_user,
                u.first_name,
                u.last_name,
                u.email,
                u.occupation,
                u.active,
                u.auth_version,
                u.last_login,
                u.created_at,
                COALESCE(
                    ARRAY_AGG(DISTINCT r.name)
                        FILTER (WHERE r.name IS NOT NULL),
                    ARRAY[]::VARCHAR[]
                ) AS roles,
                COALESCE(
                    ARRAY_AGG(DISTINCT p.code)
                        FILTER (WHERE p.code IS NOT NULL),
                    ARRAY[]::VARCHAR[]
                ) AS permissions
            FROM users u
            LEFT JOIN user_roles ur ON ur.id_user = u.id_user
            LEFT JOIN roles r ON r.id_role = ur.id_role
            LEFT JOIN role_permissions rp ON rp.id_role = r.id_role
            LEFT JOIN permissions p ON p.id_permission = rp.id_permission
            WHERE u.id_user = $1
            GROUP BY u.id_user
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
