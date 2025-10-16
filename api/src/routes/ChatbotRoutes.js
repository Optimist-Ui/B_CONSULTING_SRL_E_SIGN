// api/src/routes/ChatbotRoutes.js
const express = require("express");
const validate = require("../middlewares/validate");
const authenticateUser = require("../middlewares/authenticate");
const chatbotRateLimiter = require("../middlewares/chatbotRateLimiter");
const {
  sendMessageValidation,
  startSessionValidation,
  helpRequestValidation,
  rateSessionValidation,
  sessionIdValidation,
  analyticsValidation,
} = require("../validations/ChatbotValidations");

/**
 * @swagger
 * tags:
 *   name: Chatbot
 *   description: AI-powered customer-support chatbot
 */

module.exports = (container) => {
  const router = express.Router();
  const chatbotController = container.resolve("chatbotController");

  /* ----------  helpers  ---------- */
  const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    return token ? authenticateUser(req, res, next) : next();
  };

  /* ==========================================================
   * 1.  POST  /api/chatbot/session/start
   * ========================================================== */
  /**
   * @swagger
   * /api/chatbot/session/start:
   *   post:
   *     tags: [Chatbot]
   *     summary: Start a new chat session
   *     description: Initialise a fresh conversation session (logged-in or anonymous).
   *     security: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               page:
   *                 type: string
   *                 description: URL of the page where the chat was started
   *                 example: "/dashboard/contracts"
   *     responses:
   *       200:
   *         description: Session created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 sessionId:
   *                   type: string
   *                   format: uuid
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.post(
    "/session/start",
    optionalAuth,
    startSessionValidation,
    validate,
    chatbotController.startSession.bind(chatbotController)
  );

  /* ==========================================================
   * 2.  POST  /api/chatbot/message
   * ========================================================== */
  /**
   * @swagger
   * /api/chatbot/message:
   *   post:
   *     tags: [Chatbot]
   *     summary: Send a message to the chatbot
   *     description: |
   *       Send a user message and receive an AI-generated reply.
   *       The reply is streamed back as JSON chunks (`data: {chunk}`).
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [sessionId, message]
   *             properties:
   *               sessionId:
   *                 type: string
   *                 format: uuid
   *                 example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *               message:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 1000
   *                 example: "How do I send an NDA?"
   *               page:
   *                 type: string
   *                 description: Current page URL for context
   *                 example: "/templates/nda"
   *     responses:
   *       200:
   *         description: AI reply (streamed)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 text:
   *                   type: string
   *                 finishReason:
   *                   type: string
   *       400:
   *         description: Validation error
   *       429:
   *         description: Rate-limit exceeded
   *       500:
   *         description: Internal server error
   */
  router.post(
    "/message",
    optionalAuth,
    chatbotRateLimiter,
    sendMessageValidation,
    validate,
    chatbotController.sendMessage.bind(chatbotController)
  );

  /* ==========================================================
   * 3.  GET  /api/chatbot/session/{sessionId}
   * ========================================================== */
  /**
   * @swagger
   * /api/chatbot/session/{sessionId}:
   *   get:
   *     tags: [Chatbot]
   *     summary: Get conversation history
   *     description: Retrieve all messages for a given session
   *     security: []
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: UUID of the session
   *     responses:
   *       200:
   *         description: Array of messages
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   role:
   *                     type: string
   *                     enum: [user, assistant, system]
   *                   content:
   *                     type: string
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *       404:
   *         description: Session not found
   *       500:
   *         description: Internal server error
   */
  router.get(
    "/session/:sessionId",
    sessionIdValidation,
    validate,
    chatbotController.getSessionHistory.bind(chatbotController)
  );

  /* ==========================================================
   * 4.  POST  /api/chatbot/help-request
   * ========================================================== */
  /**
   * @swagger
   * /api/chatbot/help-request:
   *   post:
   *     tags: [Chatbot]
   *     summary: Submit a human-support request
   *     description: |
   *       Escalate the conversation to a human agent.
   *       An email ticket is created and the session is flagged.
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [sessionId, email, category, subject, description]
   *             properties:
   *               sessionId:
   *                 type: string
   *                 format: uuid
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "jane@example.com"
   *               name:
   *                 type: string
   *                 maxLength: 100
   *                 example: "Jane Doe"
   *               phone:
   *                 type: string
   *                 pattern: "^[\\d\\s\\+\\-\\(\\)+]+$"
   *                 example: "+1-415-555-1234"
   *               category:
   *                 type: string
   *                 enum: [technical_issue, billing_question, feature_request, bug_report, account_help, subscription_help, document_issue, other]
   *               subject:
   *                 type: string
   *                 minLength: 5
   *                 maxLength: 200
   *                 example: "Cannot upload PDF"
   *               description:
   *                 type: string
   *                 minLength: 10
   *                 maxLength: 2000
   *                 example: "Every time I try to upload a PDF the progress bar freezes at 100 %."
   *     responses:
   *       200:
   *         description: Ticket created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ticketId:
   *                   type: string
   *                 message:
   *                   type: string
   *                   example: "We’ve received your request and will respond shortly."
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.post(
    "/help-request",
    optionalAuth,
    helpRequestValidation,
    validate,
    chatbotController.submitHelpRequest.bind(chatbotController)
  );

  /* ==========================================================
   * 5.  POST  /api/chatbot/session/{sessionId}/rate
   * ========================================================== */
  /**
   * @swagger
   * /api/chatbot/session/{sessionId}/rate:
   *   post:
   *     tags: [Chatbot]
   *     summary: Rate a session
   *     description: Provide a 1-5 star rating and optional feedback
   *     security: []
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [rating]
   *             properties:
   *               rating:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *                 example: 5
   *               feedback:
   *                 type: string
   *                 maxLength: 500
   *                 example: "Very helpful, solved my issue in seconds!"
   *     responses:
   *       200:
   *         description: Rating saved
   *       400:
   *         description: Validation error
   *       404:
   *         description: Session not found
   *       500:
   *         description: Internal server error
   */
  router.post(
    "/session/:sessionId/rate",
    rateSessionValidation,
    validate,
    chatbotController.rateSession.bind(chatbotController)
  );

  /* ==========================================================
   * 6.  DELETE  /api/chatbot/session/{sessionId}
   * ========================================================== */
  /**
   * @swagger
   * /api/chatbot/session/{sessionId}:
   *   delete:
   *     tags: [Chatbot]
   *     summary: Delete a session
   *     description: |
   *       Permanently delete the session and all its messages.
   *       Works for both anonymous and logged-in users.
   *     security: []
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       204:
   *         description: Session deleted successfully
   *       404:
   *         description: Session not found
   *       500:
   *         description: Internal server error
   */
  router.delete(
    "/session/:sessionId",
    sessionIdValidation,
    validate,
    chatbotController.clearSession.bind(chatbotController)
  );

  /* ==========================================================
   * 7.  GET  /api/chatbot/analytics
   * ========================================================== */
  /**
   * @swagger
   * /api/chatbot/analytics:
   *   get:
   *     tags: [Chatbot]
   *     summary: Analytics dashboard (admin)
   *     description: |
   *       Aggregated metrics such as total sessions, avg. rating,
   *       busiest day, escalation rate, etc.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         example: "2025-01-01"
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         example: "2025-01-31"
   *     responses:
   *       200:
   *         description: Analytics data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 totalSessions:
   *                   type: integer
   *                 avgRating:
   *                   type: number
   *                 escalationRate:
   *                   type: number
   *                 topIntents:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       intent:
   *                         type: string
   *                       count:
   *                         type: integer
   *       401:
   *         description: Unauthorized (admin only)
   *       500:
   *         description: Internal server error
   */
  router.get(
    "/analytics",
    authenticateUser,
    analyticsValidation,
    validate,
    chatbotController.getAnalytics.bind(chatbotController)
  );

  return router;
};
