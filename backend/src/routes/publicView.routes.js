const express = require("express");
const controller = require("../controllers/publicView.controller");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();
router.get("/:resourceType/:resourceId", asyncHandler(controller.get));
router.post("/:resourceType/:resourceId", asyncHandler(controller.increment));

module.exports = router;
