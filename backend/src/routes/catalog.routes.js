const express = require("express");

const {
    listCatalogs,
    getCatalog
} = require("../controllers/catalog.controller");

const {
    asyncHandler
} = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", listCatalogs);
router.get("/:catalog", asyncHandler(getCatalog));

module.exports = router;
