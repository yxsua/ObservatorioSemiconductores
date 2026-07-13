const authRepository = require(
    "../repositories/auth.repository"
);

const {
    registerSchema,
    loginSchema
} = require("../schemas/auth.schema");

const {
    hashPassword,
    comparePassword
} = require("../utils/password");

const {
    generateToken
} = require("../utils/jwt");

const {
    formatZodErrors
} = require("../utils/zod");

const {
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError
} = require("../errors/apiError");

class AuthService {
    /**
     * Registra públicamente un nuevo usuario.
     *
     * @param {Object} input
     * @returns {Promise<Object>}
     */
    async register(input) {
        const validationResult = registerSchema.safeParse(input);

        if (!validationResult.success) {
            throw new ValidationError(
                "Los datos de registro no son válidos.",
                formatZodErrors(validationResult.error)
            );
        }

        const {
            firstName,
            lastName,
            email,
            occupation,
            password
        } = validationResult.data;

        const existingUser =
            await authRepository.findUserByEmail(email);

        if (existingUser) {
            throw new ConflictError(
                "El correo electrónico ya está registrado."
            );
        }

        const passwordHash = await hashPassword(password);

        let createdUser;

        try {
            createdUser = await authRepository.createUser({
                firstName,
                lastName,
                email,
                occupation: occupation || null,
                passwordHash
            });
        } catch (error) {
            /*
             * PostgreSQL 23505:
             * unique_violation.
             */
            if (error.code === "23505") {
                throw new ConflictError(
                    "El correo electrónico ya está registrado."
                );
            }

            throw error;
        }

        const token = generateToken({
            id: createdUser.id_user,
            email: createdUser.email
        });

        return {
            user: this.mapUser(createdUser),
            token
        };
    }

    /**
     * Inicia sesión mediante correo y contraseña.
     *
     * @param {Object} input
     * @returns {Promise<Object>}
     */
    async login(input) {
        const validationResult = loginSchema.safeParse(input);

        if (!validationResult.success) {
            throw new ValidationError(
                "Los datos de inicio de sesión no son válidos.",
                formatZodErrors(validationResult.error)
            );
        }

        const {
            email,
            password
        } = validationResult.data;

        const user =
            await authRepository.findUserByEmail(email);

        if (!user) {
            throw new UnauthorizedError(
                "El correo electrónico o la contraseña son incorrectos."
            );
        }

        const passwordMatches = await comparePassword(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            throw new UnauthorizedError(
                "El correo electrónico o la contraseña son incorrectos."
            );
        }

        if (!user.active) {
            throw new ForbiddenError(
                "La cuenta se encuentra desactivada."
            );
        }

        await authRepository.updateLastLogin(user.id_user);

        /*
         * El objeto obtenido mediante findUserByEmail no contiene
         * last_login actualizado. Para el MVP puede devolverse null,
         * o consultar nuevamente el usuario.
         */
        const token = generateToken({
            id: user.id_user,
            email: user.email
        });

        return {
            user: this.mapUser(user),
            token
        };
    }

    /**
     * Obtiene el perfil del usuario autenticado.
     *
     * @param {number|string} userId
     * @returns {Promise<Object>}
     */
    async getProfile(userId) {
        const normalizedUserId = Number(userId);

        if (
            !Number.isSafeInteger(normalizedUserId) ||
            normalizedUserId <= 0
        ) {
            throw new UnauthorizedError(
                "La sesión no contiene un usuario válido."
            );
        }

        const user = await authRepository.findUserById(
            normalizedUserId
        );

        if (!user) {
            throw new NotFoundError(
                "El usuario asociado a la sesión ya no existe."
            );
        }

        if (!user.active) {
            throw new ForbiddenError(
                "La cuenta se encuentra desactivada."
            );
        }

        return this.mapUser(user);
    }

    /**
     * Convierte el modelo de PostgreSQL al formato público de la API.
     *
     * @param {Object} user
     * @returns {Object}
     */
    mapUser(user) {
        return {
            id: user.id_user,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            occupation: user.occupation ?? null,
            active: user.active,
            lastLogin: user.last_login ?? null,
            createdAt: user.created_at ?? null
        };
    }
}

module.exports = new AuthService();
