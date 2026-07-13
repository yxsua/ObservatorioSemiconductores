const express = require("express");
const controller = require("../controllers/alert.controller");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();
router.get("/", asyncHandler(controller.listPublic));
router.get("/:id", asyncHandler(controller.getPublic));
module.exports = router;
