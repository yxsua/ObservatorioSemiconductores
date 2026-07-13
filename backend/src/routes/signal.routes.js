const express = require("express");

const {
    listPublicSignals,
    getPublicSignal
} = require("../controllers/signal.controller");

const {
    asyncHandler
} = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(listPublicSignals));
router.get("/:id", asyncHandler(getPublicSignal));

module.exports = router;
