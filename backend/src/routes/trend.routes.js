const express = require("express");
const {
    listPublic,
    getPublic
} = require("../controllers/trend.controller");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();
router.get("/", asyncHandler(listPublic));
router.get("/:id", asyncHandler(getPublic));

module.exports = router;
