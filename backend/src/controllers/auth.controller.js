const authService = require(
    "../services/auth.service"
);

const {
    successResponse
} = require("../utils/apiResponse");

async function register(req, res) {
    const result = await authService.register(req.body);

    return res.status(201).json(
        successResponse(
            result,
            "Usuario registrado correctamente."
        )
    );
}

async function login(req, res) {
    const result = await authService.login(req.body);

    return res.status(200).json(
        successResponse(
            result,
            "Inicio de sesión exitoso."
        )
    );
}

async function getProfile(req, res) {
    const user = await authService.getProfile(
        req.user.id
    );

    return res.status(200).json(
        successResponse(
            user,
            "Perfil obtenido correctamente."
        )
    );
}

module.exports = {
    register,
    login,
    getProfile
};