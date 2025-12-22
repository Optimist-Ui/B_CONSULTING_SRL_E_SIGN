// src/validations/SubscriptionValidations.js
const { body, param } = require("express-validator");

/**
 * ✅ FIXED: Validation rules for creating a new subscription
 * Now matches what the controller actually receives
 */
const createSubscriptionValidation = [
  // planId (MongoDB ObjectId) - used to find the plan in the database
  body("planId")
    .notEmpty()
    .withMessage("Plan ID is required.")
    .isString()
    .withMessage("Plan ID must be a string.")
    .isMongoId()
    .withMessage("Plan ID must be a valid MongoDB ObjectId."),

  // paymentMethodId - the Viva Wallet payment source ID (e.g., "viva_abc123")
  body("paymentMethodId")
    .notEmpty()
    .withMessage("Payment Method ID is required.")
    .isString()
    .withMessage("Payment Method ID must be a string."),

  // Optional: billing interval (defaults to "month" in controller)
  body("billingInterval")
    .optional()
    .isIn(["month", "year"])
    .withMessage("Billing interval must be 'month' or 'year'."),
];

/**
 * Validation for trial subscription creation
 */
const createTrialSubscriptionValidation = [
  body("planId")
    .notEmpty()
    .withMessage("Plan ID is required.")
    .isString()
    .withMessage("Plan ID must be a string.")
    .isMongoId()
    .withMessage("Plan ID must be a valid MongoDB ObjectId."),

  body("paymentMethodId")
    .notEmpty()
    .withMessage("Payment Method ID is required.")
    .isString()
    .withMessage("Payment Method ID must be a string."),
];

/**
 * For attaching a new payment method or setting the default
 */
const paymentMethodIdBodyValidation = [
  body("paymentMethodId")
    .notEmpty()
    .withMessage("Payment Method ID is required.")
    .isString(),
];

/**
 * For detaching a payment method from the URL
 */
const paymentMethodIdParamValidation = [
  param("paymentMethodId")
    .notEmpty()
    .withMessage("Payment Method ID is required in the URL.")
    .isString(),
];

module.exports = {
  createSubscriptionValidation,
  createTrialSubscriptionValidation, // ✅ Added separate trial validation
  paymentMethodIdBodyValidation,
  paymentMethodIdParamValidation,
};
