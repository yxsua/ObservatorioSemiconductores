const express = require("express");

const {
    listSources, getSource, createSource, updateSource, deactivateSource
} = require("../controllers/source.controller");

const {
    authenticate
} = require("../middleware/auth.middleware");

const {
    requireAnyPermission, requirePermissions
} = require("../middleware/permission.middleware");

const {
    asyncHandler
} = require("../utils/asyncHandler");

const router = express.Router();

router.get(
    "/",
    authenticate,
    requireAnyPermission("sources:read-internal", "signals:read-internal", "signals:create"),
    asyncHandler(listSources)
);
router.post("/", authenticate, requirePermissions("sources:create"), asyncHandler(createSource));
router.get("/:id", authenticate, requirePermissions("sources:read-internal"), asyncHandler(getSource));
router.patch("/:id", authenticate, requirePermissions("sources:update"), asyncHandler(updateSource));
router.post("/:id/deactivate", authenticate, requirePermissions("sources:deactivate"), asyncHandler(deactivateSource));

module.exports = router;
