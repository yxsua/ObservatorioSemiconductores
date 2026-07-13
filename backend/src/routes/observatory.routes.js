const express = require("express");

const {
    getAlerts,
    getCatalogs,
    getContent,
    getSignals,
    getSources,
    getSummary,
    getTrends
} = require("../controllers/observatory.controller");

const {
    asyncHandler
} = require("../utils/asyncHandler");

const router = express.Router();

router.get("/catalogs", asyncHandler(getCatalogs));
router.get("/summary", asyncHandler(getSummary));
router.get("/sources", asyncHandler(getSources));
router.get("/signals", asyncHandler(getSignals));
router.get("/trends", asyncHandler(getTrends));
router.get("/alerts", asyncHandler(getAlerts));
router.get("/content", asyncHandler(getContent));

module.exports = router;
