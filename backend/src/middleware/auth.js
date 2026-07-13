const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(
      new AppError("Token de autenticación requerido", 401),
    );
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(
      new AppError("Formato de token inválido", 401),
    );
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET,
    );

    req.user = {
      id: payload.id,
      tipo: payload.tipo,
      nombre: payload.nombre,
      email: payload.email,
    };

    next();
  } catch (error) {
    return next(
      new AppError("Token inválido o expirado", 401),
    );
  }
};

module.exports = auth;