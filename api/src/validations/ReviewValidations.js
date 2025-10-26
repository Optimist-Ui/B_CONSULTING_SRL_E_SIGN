// validations/ReviewValidations.js
const { body, param } = require("express-validator");
const Review = require("../models/ReviewModel"); // Adjust path if necessary

// Get the question keys from the model to keep validations in sync
const questionKeys = Object.keys(Review.getQuestions());

/**
 * Validation rules for submitting a new review.
 */
const createReviewValidation = [
  body("answers")
    .isObject()
    .withMessage("The 'answers' field must be an object."),
  
  // Dynamically create a validation rule for each question
  ...questionKeys.map(key =>
    body(`answers.${key}`)
      .isInt({ min: 1, max: 5 })
      .withMessage(`Answer for '${key}' must be an integer between 1 and 5.`)
  ),

  body("comment")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Comment must be a string and cannot exceed 2000 characters."),
];

/**
 * Validation rule for a packageId in the URL.
 */
const packageIdValidation = [
  param("packageId")
    .isMongoId()
    .withMessage("A valid package ID is required in the URL."),
];

/**
 * Validation rule for a participantId in the URL.
 */
const participantIdValidation = [
  param("participantId")
    .notEmpty()
    .withMessage("A valid participant ID is required in the URL."),
];

module.exports = {
  createReviewValidation,
  packageIdValidation,
  participantIdValidation,
};