const { validationResult } = require("express-validator");

/**
 * Middleware to process validation results from express-validator.
 * If validation errors exist, responds with a 400 status and consolidated error details.
 * Otherwise, passes control to the next middleware/controller.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = {};

    errors.array().forEach((error) => {
      const fieldName = error.path; // Use 'path' instead of 'param' for consistency

      if (fieldName) {
        if (!formattedErrors[fieldName]) {
          formattedErrors[fieldName] = [];
        }
        formattedErrors[fieldName].push(error.msg);
      }
    });

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    });
  }

  next();
};

module.exports = validate;
