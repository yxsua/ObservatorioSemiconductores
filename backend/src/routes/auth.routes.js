const express = require("express");

const {
    register,
    login,
    getProfile
} = require("../controllers/auth.controller");

const {
    authenticate
} = require("../middleware/auth.middleware");

const {
    asyncHandler
} = require("../utils/asyncHandler");

const router = express.Router();

router.post(
    "/register",
    asyncHandler(register)
);

router.post(
    "/login",
    asyncHandler(login)
);

router.get(
    "/me",
    authenticate,
    asyncHandler(getProfile)
);

module.exports = router;