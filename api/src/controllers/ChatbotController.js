// api/src/controllers/ChatbotController.js

class ChatbotController {
  constructor({ chatbotService }) {
    this.chatbotService = chatbotService;
  }

  /**
   * Send a message to the chatbot
   */
  async sendMessage(req, res) {
    try {
      const { sessionId, message } = req.body;
      const userId = req.user?.id || null; // Optional auth

      if (!sessionId || !message) {
        return res.status(400).json({
          success: false,
          error: "sessionId and message are required",
        });
      }

      const metadata = {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip || req.connection.remoteAddress,
        page: req.body.page,
        referrer: req.headers.referer,
      };

      const response = await this.chatbotService.processMessage(
        sessionId,
        message,
        { userId, metadata }
      );

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error("Error in sendMessage:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to process message",
      });
    }
  }

  /**
   * Start a new chat session
   */
  async startSession(req, res) {
    try {
      const { v4: uuidv4 } = require("uuid");
      const sessionId = uuidv4();
      const userId = req.user?.id || null;

      const metadata = {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip || req.connection.remoteAddress,
        page: req.body.page,
        referrer: req.headers.referer,
      };

      const session = await this.chatbotService.getOrCreateSession(
        sessionId,
        userId,
        metadata
      );

      // Get greeting message based on user
      let greetingMessage = "Hello! How can I help you today?";
      
      if (userId) {
        const userContext = await this.chatbotService.getUserContext(userId);
        if (userContext) {
          greetingMessage = `Hello ${userContext.firstName}! I'm here to help you with your e-signing needs. What can I assist you with today?`;
        }
      }

      res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          greeting: greetingMessage,
          language: session.language,
        },
      });
    } catch (error) {
      console.error("Error in startSession:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start session",
      });
    }
  }

  /**
   * Get conversation history
   */
  async getSessionHistory(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "sessionId is required",
        });
      }

      const session = await this.chatbotService.getSessionHistory(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
        });
      }

      res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          language: session.language,
          messages: session.messages,
          status: session.status,
          createdAt: session.createdAt,
        },
      });
    } catch (error) {
      console.error("Error in getSessionHistory:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch session history",
      });
    }
  }

  /**
   * Submit a help request
   */
  async submitHelpRequest(req, res) {
    try {
      const { sessionId, email, name, phone, category, subject, description } =
        req.body;

      if (!sessionId || !email || !category || !subject || !description) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
        });
      }

      const helpRequest = await this.chatbotService.createHelpRequest(
        sessionId,
        {
          email,
          name,
          phone,
          category,
          subject,
          description,
        }
      );

      res.json({
        success: true,
        message: "Help request submitted successfully",
        data: {
          requestId: helpRequest._id,
          status: helpRequest.status,
          priority: helpRequest.priority,
        },
      });
    } catch (error) {
      console.error("Error in submitHelpRequest:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to submit help request",
      });
    }
  }

  /**
   * Rate a chat session
   */
  async rateSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { rating, feedback } = req.body;

      if (!sessionId || !rating) {
        return res.status(400).json({
          success: false,
          error: "sessionId and rating are required",
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: "Rating must be between 1 and 5",
        });
      }

      await this.chatbotService.rateSession(sessionId, rating, feedback || "");

      res.json({
        success: true,
        message: "Thank you for your feedback!",
      });
    } catch (error) {
      console.error("Error in rateSession:", error);
      res.status(500).json({
        success: false,
        error: "Failed to submit rating",
      });
    }
  }

  /**
   * Clear/delete a session
   */
  async clearSession(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "sessionId is required",
        });
      }

      const session = await this.chatbotService.ChatSession.findOne({
        sessionId,
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
        });
      }

      // Mark as abandoned instead of deleting
      session.status = "abandoned";
      await session.save();

      res.json({
        success: true,
        message: "Session cleared successfully",
      });
    } catch (error) {
      console.error("Error in clearSession:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear session",
      });
    }
  }

  /**
   * Get analytics (Admin only - we'll add auth later)
   */
  async getAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const analytics = await this.chatbotService.getAnalytics(start, end);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Error in getAnalytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch analytics",
      });
    }
  }
}

module.exports = ChatbotController;