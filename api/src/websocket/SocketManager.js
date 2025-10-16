// api/src/websocket/SocketManager.js - FIXED VERSION

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

    // ✅ UPDATED: Optional authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      // If no token, allow connection but mark as anonymous
      if (!token) {
        socket.user = null; // Anonymous user
        socket.isAnonymous = true;
        return next();
      }

      // If token exists, verify it
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        socket.isAnonymous = false;
        next();
      } catch (err) {
        // Invalid token - still allow connection but mark as anonymous
        socket.user = null;
        socket.isAnonymous = true;
        next();
      }
    });

    this.setupSocketHandlers();
    console.log("Socket.IO server initialized");
    return this.io;
  }

  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      const userIdentifier = socket.user?.id || socket.id;
      const userType = socket.isAnonymous ? "Anonymous" : "Authenticated";

      console.log(
        `${userType} user connected: ${userIdentifier} (socket: ${socket.id})`
      );

      // ✅ Only join user room if authenticated
      if (!socket.isAnonymous && socket.user) {
        const userRoom = `user_${socket.user.id}`;
        socket.join(userRoom);
        console.log(`Socket ${socket.id} joined user room: ${userRoom}`);
      } else if (socket.isAnonymous) {
        // Anonymous users can only use chatbot features
        console.log(`Anonymous user ${socket.id} - chatbot access only`);
      }

      // ✅ Handle joining chat session rooms (for chatbot)
      socket.on("join_chat_session", (sessionId) => {
        if (!sessionId) return;

        const chatRoom = `chat_${sessionId}`;
        socket.join(chatRoom);
        console.log(`Socket ${socket.id} joined chat room: ${chatRoom}`);

        socket.emit("chat_session_joined", {
          sessionId,
          timestamp: new Date().toISOString(),
        });
      });

      // ✅ Handle leaving chat session rooms
      socket.on("leave_chat_session", (sessionId) => {
        if (!sessionId) return;

        const chatRoom = `chat_${sessionId}`;
        socket.leave(chatRoom);
        console.log(`Socket ${socket.id} left chat room: ${chatRoom}`);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(
          `User disconnected: ${userIdentifier} (socket: ${socket.id})`
        );
      });
    });
  }

  // Emit package updates to the owner's user room (existing functionality)
  emitPackageUpdate(ownerId, updateData) {
    if (!this.io) return;

    // Safety check: ownerId must be valid
    if (!ownerId) {
      console.warn("emitPackageUpdate called without ownerId");
      return;
    }

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

  // ✅ NEW: Emit to specific chat room
  emitToChatRoom(sessionId, eventName, data) {
    if (!this.io) return;

    const roomName = `chat_${sessionId}`;
    this.io.to(roomName).emit(eventName, {
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  // ✅ NEW: Broadcast to all connected sockets
  broadcastToAll(eventName, data) {
    if (!this.io) return;

    this.io.emit(eventName, {
      timestamp: new Date().toISOString(),
      ...data,
    });
  }
}

module.exports = SocketManager;
