const authorizationRepository = require(
    "../repositories/authorization.repository"
);

const {
    UnauthorizedError,
    ForbiddenError
} = require("../errors/apiError");

function normalizePermissions(permissionCodes) {
    const permissions = permissionCodes
        .flat()
        .map((permission) => String(permission).trim())
        .filter(Boolean);

    if (permissions.length === 0) {
        throw new TypeError(
            "El middleware de permisos requiere al menos un permiso."
        );
    }

    return [...new Set(permissions)];
}

function authorize(permissionCodes, requireAll) {
    const requiredPermissions = normalizePermissions(permissionCodes);

    return async function permissionMiddleware(req, res, next) {
        try {
            if (!req.user?.id) {
                throw new UnauthorizedError(
                    "Se requiere autenticación antes de comprobar permisos."
                );
            }

            const authorization =
                await authorizationRepository.getUserAuthorization(
                    req.user.id
                );

            if (!authorization) {
                throw new UnauthorizedError(
                    "El usuario asociado a la sesión ya no existe."
                );
            }

            if (!authorization.active) {
                throw new ForbiddenError(
                    "La cuenta se encuentra desactivada."
                );
            }

            const grantedPermissions = new Set(
                authorization.permissions
            );

            const isAuthorized = requireAll
                ? requiredPermissions.every(
                    (permission) => grantedPermissions.has(permission)
                )
                : requiredPermissions.some(
                    (permission) => grantedPermissions.has(permission)
                );

            if (!isAuthorized) {
                throw new ForbiddenError();
            }

            req.user.permissions = authorization.permissions;

            return next();
        } catch (error) {
            return next(error);
        }
    };
}

function requirePermissions(...permissionCodes) {
    return authorize(permissionCodes, true);
}

function requireAnyPermission(...permissionCodes) {
    return authorize(permissionCodes, false);
}

module.exports = {
    requirePermissions,
    requireAnyPermission
};
