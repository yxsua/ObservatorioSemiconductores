const express = require("express");

const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth.routes");

const {
    notFoundHandler
} = require("./middleware/notFound.middleware");

const {
    errorHandler
} = require("./middleware/error.middleware");

const app = express();

app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;