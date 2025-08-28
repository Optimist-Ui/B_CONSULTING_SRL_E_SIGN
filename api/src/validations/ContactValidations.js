const { body, param } = require("express-validator");

/**
 * Validation rules for creating a new contact.
 * Enforces required fields based on the schema.
 */
const createContactValidation = [
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("A valid email is required"),
  body("title").optional().isString().withMessage("Title must be a string"),
  body("phone")
    .optional()
    .isString()
    .withMessage("Phone must be a valid phone number format"),
  body("dob")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Date of birth must be a valid date"),
  body("language")
    .optional()
    .isString()
    .withMessage("Language must be a string"),
  body("customFields")
    .optional()
    .isObject()
    .withMessage("Custom fields must be an object."),
  body("customFields.*")
    .optional()
    .isString()
    .withMessage("All custom field values must be strings."),
];

/**
 * Validation rules for updating a contact.
 * All fields are optional for PATCH requests, but if provided, they must be valid.
 */
const updateContactValidation = [
  body("firstName")
    .optional()
    .notEmpty()
    .withMessage("First name cannot be empty"),
  body("lastName")
    .optional()
    .notEmpty()
    .withMessage("Last name cannot be empty"),
  body("email").optional().isEmail().withMessage("A valid email is required"),
  body("title").optional().isString().withMessage("Title must be a string"),
  body("phone")
    .optional()
    .isString()
    .withMessage("Phone must be a valid phone number format"),
  body("dob")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Date of birth must be a valid date"),
  body("language")
    .optional()
    .isString()
    .withMessage("Language must be a string"),
  body("customFields")
    .optional()
    .isObject()
    .withMessage("Custom fields must be an object."),
  body("customFields.*")
    .optional()
    .isString()
    .withMessage("All custom field values must be strings."),
];

/**
 * Validation rule for ensuring a contactId in the URL is a valid MongoDB ObjectId.
 * This is used for GET, PATCH, and DELETE operations on a specific contact.
 */
const contactIdValidation = [
  param("contactId")
    .isMongoId()
    .withMessage("A valid contact ID is required in the URL parameter."),
];

module.exports = {
  createContactValidation,
  updateContactValidation,
  contactIdValidation,
};
