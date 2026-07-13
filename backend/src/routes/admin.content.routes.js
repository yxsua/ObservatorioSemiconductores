const express = require("express");
const controller = require("../controllers/content.controller");
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
    requirePermissions("content:read-internal"),
    asyncHandler(controller.list)
);
router.post(
    "/",
    requirePermissions("content:create"),
    asyncHandler(controller.create)
);
router.get(
    "/:id/history",
    requirePermissions("content:read-internal"),
    asyncHandler(controller.history)
);
router.get(
    "/:id/preview",
    requirePermissions("content:read-internal"),
    asyncHandler(controller.preview)
);
router.get(
    "/:id/versions",
    requirePermissions("content:read-internal"),
    asyncHandler(controller.listVersions)
);
router.post(
    "/:id/versions",
    requirePermissions("content:update"),
    asyncHandler(controller.createVersion)
);
router.get(
    "/:id/versions/:versionId",
    requirePermissions("content:read-internal"),
    asyncHandler(controller.getVersion)
);
router.put(
    "/:id/versions/:versionId/composition",
    requirePermissions("content:update"),
    asyncHandler(controller.replaceComposition)
);
router.post(
    "/:id/transitions",
    requireAnyPermission(
        "content:submit",
        "content:approve",
        "content:publish",
        "content:archive"
    ),
    asyncHandler(controller.transition)
);
router.get(
    "/:id",
    requirePermissions("content:read-internal"),
    asyncHandler(controller.get)
);
router.patch(
    "/:id",
    requirePermissions("content:update"),
    asyncHandler(controller.update)
);

module.exports = router;
