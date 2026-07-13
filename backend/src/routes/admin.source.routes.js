const express = require("express");

const {
    listSources
} = require("../controllers/source.controller");

const {
    authenticate
} = require("../middleware/auth.middleware");

const {
    requireAnyPermission
} = require("../middleware/permission.middleware");

const {
    asyncHandler
} = require("../utils/asyncHandler");

const router = express.Router();

router.get(
    "/",
    authenticate,
    requireAnyPermission("signals:read-internal", "signals:create"),
    asyncHandler(listSources)
);

module.exports = router;
