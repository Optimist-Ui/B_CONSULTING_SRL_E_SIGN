// server.js (Updated with SocketManager and PackageEventEmitter initialization)
const http = require("http");
const app = require("./src/app");
const container = require("./src/config/container");


const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

const socketManager = container.resolve("socketManager");
const cronService = container.resolve("cronService");

socketManager.initialize(server);
cronService.initialize(container);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful Shutdown Handling
process.on("SIGINT", () => {
  console.log("❗ Server shutting down...");
  server.close(() => {
    console.log("✅ Server closed.");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("❗ SIGTERM received. Shutting down...");
  server.close(() => {
    console.log("✅ Server closed.");
    process.exit(0);
  });
});