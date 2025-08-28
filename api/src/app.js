const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

dotenv.config();

const container = require("./config/container");
const userRoutes = require("./routes/UserRoutes")(container); // Pass container
const packageRoutes = require("./routes/PackageRoutes")(container);
const contactRoutes = require("./routes/ContactRoutes")(container);
const templateRoutes = require("./routes/TemplateRoutes")(container);

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static(path.join(__dirname, "public")));

// ✅ Routes
app.use("/api/users", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/templates", templateRoutes);

const cronService = container.resolve("cronService");
cronService.initialize(container);

// Graceful shutdown
const gracefulShutdown = () => {
  console.log("Received shutdown signal, stopping cron jobs...");
  cronService.stopAll();
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

module.exports = app;
