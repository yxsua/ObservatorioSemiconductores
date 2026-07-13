const express = require("express");
const controller = require("../controllers/export.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requirePermissions } = require("../middleware/permission.middleware");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);
router.use(requirePermissions("exports:download"));
router.get("/history", asyncHandler(controller.history));
router.get("/:resource.:format", asyncHandler(controller.download));

module.exports = router;

