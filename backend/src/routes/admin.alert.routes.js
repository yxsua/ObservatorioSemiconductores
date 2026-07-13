const express = require("express");
const controller = require("../controllers/alert.controller");
const { authenticate } = require("../middleware/auth.middleware");
const {
    requirePermissions,
    requireAnyPermission
} = require("../middleware/permission.middleware");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();
router.use(authenticate);

router.get(
    "/",
    requirePermissions("alerts:read-internal"),
    asyncHandler(controller.listInternal)
);
router.post(
    "/",
    requirePermissions("alerts:create"),
    asyncHandler(controller.create)
);
router.get(
    "/:id/history",
    requirePermissions("alerts:read-internal"),
    asyncHandler(controller.history)
);
router.post(
    "/:id/transitions",
    requireAnyPermission(
        "alerts:submit", "alerts:validate", "alerts:publish", "alerts:close"
    ),
    asyncHandler(controller.transition)
);
router.post(
    "/:id/signals",
    requirePermissions("alerts:link-evidence"),
    asyncHandler(controller.linkSignals)
);
router.delete(
    "/:id/signals/:signalId",
    requirePermissions("alerts:link-evidence"),
    asyncHandler(controller.unlinkSignal)
);
router.post(
    "/:id/trends",
    requirePermissions("alerts:link-evidence"),
    asyncHandler(controller.linkTrends)
);
router.delete(
    "/:id/trends/:trendId",
    requirePermissions("alerts:link-evidence"),
    asyncHandler(controller.unlinkTrend)
);
router.post(
    "/:id/audiences",
    requirePermissions("alerts:link-evidence"),
    asyncHandler(controller.linkAudiences)
);
router.delete(
    "/:id/audiences/:audienceCode",
    requirePermissions("alerts:link-evidence"),
    asyncHandler(controller.unlinkAudience)
);
router.get(
    "/:id",
    requirePermissions("alerts:read-internal"),
    asyncHandler(controller.getInternal)
);
router.patch(
    "/:id",
    requirePermissions("alerts:update"),
    asyncHandler(controller.update)
);

module.exports = router;
