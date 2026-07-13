const express = require("express");
const controller = require("../controllers/content.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requirePermissions } = require("../middleware/permission.middleware");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();
router.use(authenticate);
router.use(requirePermissions("content:read-internal"));

router.get("/", asyncHandler(controller.listTemplates));
router.get("/:id", asyncHandler(controller.getTemplate));

module.exports = router;
