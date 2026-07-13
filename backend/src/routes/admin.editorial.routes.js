const express = require("express");
const { listBlockTypes } = require("../controllers/editorial.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireAnyPermission } = require("../middleware/permission.middleware");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();
router.use(authenticate);

router.get(
    "/block-types",
    requireAnyPermission(
        "content:read-internal",
        "content:create",
        "content:update"
    ),
    asyncHandler(listBlockTypes)
);

module.exports = router;
