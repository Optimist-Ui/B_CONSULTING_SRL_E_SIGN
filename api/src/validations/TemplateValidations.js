const { body, param } = require("express-validator");

const createTemplateValidation = [
  body("name")
    .notEmpty()
    .withMessage("Template name is required")
    .trim()
    .isString()
    .withMessage("Template name must be a string"),
  body("attachment_uuid")
    .notEmpty()
    .withMessage("Attachment UUID is required")
    .isString()
    .withMessage("Attachment UUID must be a string"),
  body("fileUrl")
    .notEmpty()
    .withMessage("File URL is required")
    .isString()
    .withMessage("File URL must be a string"),
  body("s3Key") //  ADD THIS
    .notEmpty()
    .withMessage("S3 key is required")
    .isString()
    .withMessage("S3 key must be a string"),
  body("fields")
    .isArray()
    .withMessage("Fields must be an array")
    .custom((fields) => {
      if (
        !fields.every(
          (field) =>
            field.id &&
            [
              "text",
              "signature",
              "checkbox",
              "radio",
              "textarea",
              "date",
              "dropdown",
            ].includes(field.type) &&
            typeof field.page === "number" &&
            typeof field.x === "number" &&
            typeof field.y === "number" &&
            typeof field.width === "number" &&
            typeof field.height === "number" &&
            typeof field.required === "boolean" &&
            field.label &&
            typeof field.label === "string"
        )
      ) {
        throw new Error("Invalid field structure");
      }
      return true;
    }),
  body("fields.*.placeholder")
    .optional()
    .isString()
    .withMessage("Placeholder must be a string"),
  body("fields.*.options")
    .optional()
    .isArray()
    .withMessage("Options must be an array")
    .custom((options) => {
      if (
        !options.every(
          (opt) =>
            opt.value &&
            typeof opt.value === "string" &&
            opt.label &&
            typeof opt.label === "string"
        )
      ) {
        throw new Error("Each option must have a value and label");
      }
      return true;
    }),
  body("fields.*.groupId")
    .optional()
    .isString()
    .withMessage("Group ID must be a string"),
];

const updateTemplateValidation = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Template name cannot be empty")
    .trim()
    .isString()
    .withMessage("Template name must be a string"),
  body("fields")
    .optional()
    .isArray()
    .withMessage("Fields must be an array")
    .custom((fields) => {
      if (
        !fields.every(
          (field) =>
            field.id &&
            [
              "text",
              "signature",
              "checkbox",
              "radio",
              "textarea",
              "date",
              "dropdown",
            ].includes(field.type) &&
            typeof field.page === "number" &&
            typeof field.x === "number" &&
            typeof field.y === "number" &&
            typeof field.width === "number" &&
            typeof field.height === "number" &&
            typeof field.required === "boolean" &&
            field.label &&
            typeof field.label === "string"
        )
      ) {
        throw new Error("Invalid field structure");
      }
      return true;
    }),
  body("fields.*.placeholder")
    .optional()
    .isString()
    .withMessage("Placeholder must be a string"),
  body("fields.*.options")
    .optional()
    .isArray()
    .withMessage("Options must be an array")
    .custom((options) => {
      if (
        !options.every(
          (opt) =>
            opt.value &&
            typeof opt.value === "string" &&
            opt.label &&
            typeof opt.label === "string"
        )
      ) {
        throw new Error("Each option must have a value and label");
      }
      return true;
    }),
  body("fields.*.groupId")
    .optional()
    .isString()
    .withMessage("Group ID must be a string"),
];

const templateIdValidation = [
  param("templateId")
    .isMongoId()
    .withMessage("A valid template ID is required in the URL parameter"),
];

module.exports = {
  createTemplateValidation,
  updateTemplateValidation,
  templateIdValidation,
};
