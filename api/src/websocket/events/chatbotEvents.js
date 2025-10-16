// api/src/websocket/events/chatbotEvents.js

class ChatbotEventEmitter {
  constructor({ socketManager }) {
    this.socketManager = socketManager;
  }

  /**
   * Emit typing indicator to a chat session
   * @param {string} sessionId - Chat session ID
   */
  emitBotTyping(sessionId) {
    if (!this.socketManager.io) return;

    const roomName = `chat_${sessionId}`;
    this.socketManager.io.to(roomName).emit("bot_typing", {
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Stop typing indicator
   * @param {string} sessionId - Chat session ID
   */
  emitBotStoppedTyping(sessionId) {
    if (!this.socketManager.io) return;

    const roomName = `chat_${sessionId}`;
    this.socketManager.io.to(roomName).emit("bot_stopped_typing", {
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit new message to chat session
   * @param {string} sessionId - Chat session ID
   * @param {object} message - Message object
   */
  emitNewMessage(sessionId, message) {
    if (!this.socketManager.io) return;

    const roomName = `chat_${sessionId}`;
    this.socketManager.io.to(roomName).emit("bot_message", {
      sessionId,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit session status change
   * @param {string} sessionId - Chat session ID
   * @param {string} status - New status
   */
  emitSessionStatusChange(sessionId, status) {
    if (!this.socketManager.io) return;

    const roomName = `chat_${sessionId}`;
    this.socketManager.io.to(roomName).emit("session_status_changed", {
      sessionId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit escalation notification
   * @param {string} sessionId - Chat session ID
   * @param {string} helpRequestId - Help request ID
   */
  emitEscalation(sessionId, helpRequestId) {
    if (!this.socketManager.io) return;

    const roomName = `chat_${sessionId}`;
    this.socketManager.io.to(roomName).emit("chat_escalated", {
      sessionId,
      helpRequestId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit connection status
   * @param {string} sessionId - Chat session ID
   * @param {boolean} connected - Connection status
   */
  emitConnectionStatus(sessionId, connected) {
    if (!this.socketManager.io) return;

    const roomName = `chat_${sessionId}`;
    this.socketManager.io.to(roomName).emit("connection_status", {
      sessionId,
      connected,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = ChatbotEventEmitter;