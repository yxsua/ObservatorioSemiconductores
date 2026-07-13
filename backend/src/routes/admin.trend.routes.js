const express = require("express");
const controller = require("../controllers/trend.controller");
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
    requirePermissions("trends:read-internal"),
    asyncHandler(controller.listInternal)
);
router.post(
    "/",
    requirePermissions("trends:create"),
    asyncHandler(controller.create)
);
router.get(
    "/:id/history",
    requirePermissions("trends:read-internal"),
    asyncHandler(controller.history)
);
router.post(
    "/:id/transitions",
    requireAnyPermission(
        "trends:submit", "trends:validate", "trends:activate", "trends:archive"
    ),
    asyncHandler(controller.transition)
);
router.post(
    "/:id/signals",
    requirePermissions("trends:link-signals"),
    asyncHandler(controller.linkSignals)
);
router.delete(
    "/:id/signals/:signalId",
    requirePermissions("trends:link-signals"),
    asyncHandler(controller.unlinkSignal)
);
router.post(
    "/:id/actors",
    requirePermissions("trends:update"),
    asyncHandler(controller.linkActors)
);
router.delete(
    "/:id/actors/:actorId",
    requirePermissions("trends:update"),
    asyncHandler(controller.unlinkActor)
);
router.get(
    "/:id",
    requirePermissions("trends:read-internal"),
    asyncHandler(controller.getInternal)
);
router.patch(
    "/:id",
    requirePermissions("trends:update"),
    asyncHandler(controller.update)
);

module.exports = router;
