const AppError = require("../utils/AppError");

const roles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError("No autenticado", 401),
      );
    }

    if (!rolesPermitidos.includes(req.user.tipo)) {
      return next(
        new AppError("Acceso denegado", 403),
      );
    }

    next();
  };
};

module.exports = roles;