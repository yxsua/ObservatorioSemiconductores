const express = require("express");
const { listActors } = require("../controllers/trend.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireAnyPermission } = require("../middleware/permission.middleware");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();
router.get(
    "/",
    authenticate,
    requireAnyPermission("trends:read-internal", "trends:create"),
    asyncHandler(listActors)
);

module.exports = router;
