const {
    NotFoundError
} = require("../errors/ApiError");

function notFoundHandler(req, res, next) {
    return next(
        new NotFoundError(
            `La ruta ${req.method} ${req.originalUrl} no existe.`
        )
    );
}

module.exports = {
    notFoundHandler
};