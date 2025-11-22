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

const submitContactFormValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid business email"),

  body("company")
    .trim()
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Company name must be between 2 and 200 characters"),

  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[\d\s\+\-\(\)]+$/)
    .withMessage("Please provide a valid phone number"),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Message must be between 10 and 2000 characters"),
];

module.exports = {
  createContactValidation,
  updateContactValidation,
  contactIdValidation,
  submitContactFormValidation,
};
