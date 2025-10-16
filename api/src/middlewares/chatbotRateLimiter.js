// api/src/middlewares/chatbotRateLimiter.js

const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require('express-rate-limit');

// Rate limiter for chatbot messages
// 50 messages per 15 minutes per IP/session
const chatbotRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    success: false,
    error: "Too many messages sent. Please wait a moment before trying again.",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  // Skip rate limiting for authenticated users with active subscriptions
  skip: (req) => {
    // If user is authenticated and has active subscription, be more lenient
    if (req.user && req.user.subscription?.status === "active") {
      return false; // Don't skip, but could increase limit in a separate limiter
    }
    return false;
  },
  keyGenerator: (req) => {
    // Use sessionId if available, otherwise IP
    return req.body.sessionId || ipKeyGenerator(req);
  },
});

module.exports = chatbotRateLimiter;
