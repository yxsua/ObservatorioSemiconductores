const pool = require("../config/database");

class AuthorizationRepository {
    async getUserAuthorization(userId) {
        const userQuery = `
            SELECT id_user, active
            FROM users
            WHERE id_user = $1
            LIMIT 1;
        `;

        const permissionsQuery = `
            SELECT DISTINCT
                p.code AS permission_code
            FROM user_roles ur
            INNER JOIN role_permissions rp
                ON rp.id_role = ur.id_role
            INNER JOIN permissions p
                ON p.id_permission = rp.id_permission
            WHERE ur.id_user = $1;
        `;

        const [userResult, permissionsResult] = await Promise.all([
            pool.query(userQuery, [userId]),
            pool.query(permissionsQuery, [userId])
        ]);

        const user = userResult.rows[0] ?? null;

        if (!user) {
            return null;
        }

        return {
            id: user.id_user,
            active: user.active,
            permissions: permissionsResult.rows.map(
                (row) => row.permission_code
            )
        };
    }
}

module.exports = new AuthorizationRepository();
