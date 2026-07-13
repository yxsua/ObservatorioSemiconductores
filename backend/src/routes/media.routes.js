const express = require("express");
const controller = require("../controllers/media.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requirePermissions } = require("../middleware/permission.middleware");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.get(
    "/:id/download",
    authenticate,
    requirePermissions("exports:download"),
    asyncHandler(controller.download)
);
router.get("/:id", asyncHandler(controller.inline));

module.exports = router;

