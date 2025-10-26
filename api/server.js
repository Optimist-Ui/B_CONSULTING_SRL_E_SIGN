// server.js

const http = require("http");
const app = require("./src/app");
const container = require("./src/config/container");

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

// --- Resolve services from the container ---
const socketManager = container.resolve("socketManager");
const cronService = container.resolve("cronService");
const db = container.resolve("db"); // 1. Get the db object

// --- Main function to start the server ---
const startServer = async () => {
  try {
    // 2. Connect to the database BEFORE starting the server
    await db.connect();

    socketManager.initialize(server);
    cronService.initialize(container);

    server.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// --- Function for graceful shutdown ---
const shutdown = async (signal) => {
  console.log(`❗ ${signal} received. Shutting down...`);

  // Stop cron jobs
  cronService.stopAll();

  // Close server
  server.close(async () => {
    console.log("✅ HTTP server closed.");

    // 3. Close the database connection
    await db.close();

    process.exit(0);
  });
};

// --- Listen for shutdown signals ---
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// --- Start the application ---
startServer();
