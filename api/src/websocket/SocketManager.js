// websocket/SocketManager.js (Updated: Removed per-package rooms; use user-specific rooms only. Simplified handlers as dynamic package joins are not needed; initiator joins their own user room on connection.)
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

class SocketManager {
  constructor() {
    this.io = null;
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
      },
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch (err) {
        next(new Error("Authentication error: Invalid token"));
      }
    });

    this.setupSocketHandlers();
    console.log("Socket.IO server initialized");
    return this.io;
  }

  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`User connected: ${socket.user.id} (socket: ${socket.id})`);

      // Automatically join the user's personal room
      const userRoom = `user_${socket.user.id}`;
      socket.join(userRoom);
      console.log(`Socket ${socket.id} joined user room: ${userRoom}`);

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(
          `User disconnected: ${socket.user.id} (socket: ${socket.id})`
        );
      });
    });
  }

  // Emit package updates to the owner's user room
  emitPackageUpdate(ownerId, updateData) {
    if (!this.io) return;

    const roomName = `user_${ownerId}`;
    console.log(
      `Emitting package update to room: ${roomName}`,
      updateData.type
    );

    this.io.to(roomName).emit("package_updated", {
      timestamp: new Date().toISOString(),
      ...updateData,
    });
  }
}

module.exports = SocketManager;
