const {
    NotFoundError
} = require("../errors/apiError");

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
