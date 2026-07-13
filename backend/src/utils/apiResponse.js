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

function paginatedResponse(
    items,
    pagination,
    message = "Recursos obtenidos correctamente."
) {
    return successResponse(
        {
            items,
            pagination
        },
        message
    );
}

module.exports = {
    successResponse,
    emptySuccessResponse,
    paginatedResponse
};
