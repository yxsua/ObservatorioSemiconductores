const express = require("express");

const {
    listInternalSignals,
    getInternalSignal,
    createSignal,
    updateSignal,
    transitionSignal,
    getSignalHistory
} = require("../controllers/signal.controller");

const {
    authenticate
} = require("../middleware/auth.middleware");

const {
    requirePermissions,
    requireAnyPermission
} = require("../middleware/permission.middleware");

const {
    asyncHandler
} = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);

router.get(
    "/",
    requirePermissions("signals:read-internal"),
    asyncHandler(listInternalSignals)
);

router.post(
    "/",
    requirePermissions("signals:create"),
    asyncHandler(createSignal)
);

router.get(
    "/:id/history",
    requirePermissions("signals:read-internal"),
    asyncHandler(getSignalHistory)
);

router.post(
    "/:id/transitions",
    requireAnyPermission(
        "signals:submit",
        "signals:validate",
        "signals:archive"
    ),
    asyncHandler(transitionSignal)
);

router.get(
    "/:id",
    requirePermissions("signals:read-internal"),
    asyncHandler(getInternalSignal)
);

router.patch(
    "/:id",
    requireAnyPermission("signals:update-own", "signals:update-any"),
    asyncHandler(updateSignal)
);

module.exports = router;
