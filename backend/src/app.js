const express = require("express");

const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth.routes");
const catalogRoutes = require("./routes/catalog.routes");
const signalRoutes = require("./routes/signal.routes");
const adminSignalRoutes = require("./routes/admin.signal.routes");
const adminSourceRoutes = require("./routes/admin.source.routes");
const trendRoutes = require("./routes/trend.routes");
const adminTrendRoutes = require("./routes/admin.trend.routes");
const adminActorRoutes = require("./routes/admin.actor.routes");
const alertRoutes = require("./routes/alert.routes");
const adminAlertRoutes = require("./routes/admin.alert.routes");
const adminEditorialRoutes = require("./routes/admin.editorial.routes");
const adminContentRoutes = require("./routes/admin.content.routes");
const adminContentTemplateRoutes = require("./routes/admin.content-template.routes");
const adminMediaRoutes = require("./routes/admin.media.routes");
const contentRoutes = require("./routes/content.routes");
const mediaRoutes = require("./routes/media.routes");
const exportRoutes = require("./routes/export.routes");
const publicViewRoutes = require("./routes/publicView.routes");

const {
    notFoundHandler
} = require("./middleware/notFound.middleware");

const {
    errorHandler
} = require("./middleware/error.middleware");

const app = express();
const observatoryRoutes = require('./routes/observatory.routes');

app.use(express.json());
app.use('/api/data', observatoryRoutes.publicRouter);
app.use('/api/admin/data', observatoryRoutes.adminRouter);
app.use('/api', observatoryRoutes.discoveryRouter);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/catalogs", catalogRoutes);
app.use("/api/signals", signalRoutes);
app.use("/api/admin/signals", adminSignalRoutes);
app.use("/api/admin/sources", adminSourceRoutes);
app.use("/api/trends", trendRoutes);
app.use("/api/admin/trends", adminTrendRoutes);
app.use("/api/admin/actors", adminActorRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/admin/alerts", adminAlertRoutes);
app.use("/api/admin/editorial", adminEditorialRoutes);
app.use("/api/admin/content", adminContentRoutes);
app.use("/api/admin/content-templates", adminContentTemplateRoutes);
app.use("/api/admin/media", adminMediaRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/exports", exportRoutes);
app.use("/api/views", publicViewRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
