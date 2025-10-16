const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const container = require("./config/container");
const swaggerSpec = require("./config/swaggerConfig");
const injectContainer = require("./middlewares/containerMiddleware");

const userRoutes = require("./routes/UserRoutes")(container); // Pass container
const packageRoutes = require("./routes/PackageRoutes")(container);
const contactRoutes = require("./routes/ContactRoutes")(container);
const templateRoutes = require("./routes/TemplateRoutes")(container);
const subscriptionRoutes = require("./routes/SubscriptionRoutes")(container);
const paymentMethodRoutes = require("./routes/PaymentMethodRoutes")(container);
const webhookRoutes = require("./routes/WebhookRoutes")(container);
const reviewRoutes = require("./routes/ReviewRoutes")(container);
const chatbotRoutes = require("./routes/ChatbotRoutes")(container);

const app = express();

const clientURL = process.env.CLIENT_URL || "http://localhost:5173";

// 👇 Trust the proxy (Nginx in your case)
// This tells Express to read the real client IP from X-Forwarded-For header
app.set("trust proxy", 1);

app.use(cors({ origin: clientURL, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: false }));

app.use("/api/webhooks/stripe", webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 👇 Inject container into all requests (IMPORTANT for S3 upload middleware)
app.use(injectContainer(container));

// Static files and docs
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ✅ Routes
app.use("/api/users", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/plans", subscriptionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/chatbot", chatbotRoutes);

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
