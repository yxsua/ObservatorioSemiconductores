function successResponse(
    data = null,
    message = "Operación realizada correctamente."
) {
    return {
        success: true,
        message,
        data
    };
}

function emptySuccessResponse(
    message = "Operación realizada correctamente."
) {
    return {
        success: true,
        message,
        data: null
    };
}

module.exports = {
    successResponse,
    emptySuccessResponse
};