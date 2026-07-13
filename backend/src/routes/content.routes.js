const express = require("express");
const controller = require("../controllers/publicContent.controller");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(controller.list));
router.get("/:slug", asyncHandler(controller.getBySlug));

module.exports = router;

