function formatZodErrors(zodError) {
    return zodError.issues.map((issue) => ({
        field:
            issue.path.length > 0
                ? issue.path.join(".")
                : null,
        message: issue.message
    }));
}

module.exports = {
    formatZodErrors
};