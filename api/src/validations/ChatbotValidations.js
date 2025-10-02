// api/src/validations/ChatbotValidations.js

const { body, param, query } = require("express-validator");

const sendMessageValidation = [
  body("sessionId")
    .isString()
    .notEmpty()
    .withMessage("sessionId is required")
    .isUUID()
    .withMessage("sessionId must be a valid UUID"),
  body("message")
    .isString()
    .notEmpty()
    .withMessage("message is required")
    .isLength({ min: 1, max: 1000 })
    .withMessage("message must be between 1 and 1000 characters")
    .trim(),
  body("page")
    .optional()
    .isString()
    .withMessage("page must be a string"),
];

const startSessionValidation = [
  body("page")
    .optional()
    .isString()
    .withMessage("page must be a string"),
];

const helpRequestValidation = [
  body("sessionId")
    .isString()
    .notEmpty()
    .withMessage("sessionId is required")
    .isUUID()
    .withMessage("sessionId must be a valid UUID"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("name must be less than 100 characters"),
  body("phone")
    .optional()
    .isString()
    .trim()
    .matches(/^[\d\s\+\-\(\)]+$/)
    .withMessage("Invalid phone number format"),
  body("category")
    .isIn([
      "technical_issue",
      "billing_question",
      "feature_request",
      "bug_report",
      "account_help",
      "subscription_help",
      "document_issue",
      "other",
    ])
    .withMessage("Invalid category"),
  body("subject")
    .isString()
    .notEmpty()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("subject must be between 5 and 200 characters"),
  body("description")
    .isString()
    .notEmpty()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("description must be between 10 and 2000 characters"),
];

const rateSessionValidation = [
  param("sessionId")
    .isString()
    .notEmpty()
    .withMessage("sessionId is required")
    .isUUID()
    .withMessage("sessionId must be a valid UUID"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("rating must be between 1 and 5"),
  body("feedback")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("feedback must be less than 500 characters"),
];

const sessionIdValidation = [
  param("sessionId")
    .isString()
    .notEmpty()
    .withMessage("sessionId is required")
    .isUUID()
    .withMessage("sessionId must be a valid UUID"),
];

const analyticsValidation = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("endDate must be a valid date"),
];

module.exports = {
  sendMessageValidation,
  startSessionValidation,
  helpRequestValidation,
  rateSessionValidation,
  sessionIdValidation,
  analyticsValidation,
};