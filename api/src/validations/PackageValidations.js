// validations/PackageValidations.js (Updated)
const { body, query, param } = require("express-validator");

const assignedUserValidator = (au) => {
  // Base structure is always required
  if (
    !au.id ||
    !au.contactId ||
    !au.contactName ||
    !au.contactEmail ||
    !["Signer", "FormFiller", "Approver"].includes(au.role)
  ) {
    return false;
  }

  // Role-specific validation
  if (au.role === "Signer") {
    const methods = au.signatureMethods;
    if (!Array.isArray(methods) || methods.length === 0) {
      return false; // Signers must have an array of methods
    }
    // Each method must be one of the allowed types
    const validMethods = ["Email OTP", "SMS OTP"];
    if (!methods.every((method) => validMethods.includes(method))) {
      return false;
    }
  }
  return true;
};

const createPackageValidation = [
  body("name")
    .notEmpty()
    .withMessage("Package name is required")
    .trim()
    .isString()
    .withMessage("Package name must be a string"),
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
  body("templateId")
    .optional()
    .isMongoId()
    .withMessage("Template ID must be a valid MongoDB ID"),
  body("status")
    .optional()
    .isIn(["Draft", "Sent"])
    .withMessage('Invalid status. Must be either "Draft" or "Sent".'),
  body("fields")
    .isArray()
    .withMessage("Fields must be an array")
    // First, validate the structure of every field, regardless of status.
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
            typeof field.label === "string" &&
            (!field.assignedUsers ||
              field.assignedUsers.every(assignedUserValidator))
        )
      ) {
        throw new Error("Invalid field or assigned user structure");
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
  body("receivers")
    .isArray()
    .withMessage("Receivers must be an array")
    .custom((receivers) => {
      if (
        !receivers.every(
          (rec) =>
            rec.id && rec.contactId && rec.contactName && rec.contactEmail
        )
      ) {
        throw new Error("Invalid receiver structure");
      }
      return true;
    }),
  body("options")
    .isObject()
    .withMessage("Options must be an object")
    .custom((options) => {
      if (
        (options.expiresAt && isNaN(new Date(options.expiresAt).getTime())) ||
        typeof options.sendExpirationReminders !== "boolean" ||
        (options.reminderPeriod &&
          ![
            "1_day_before",
            "2_days_before",
            "1_hour_before",
            "2_hours_before",
          ].includes(options.reminderPeriod)) ||
        typeof options.sendAutomaticReminders !== "boolean" ||
        (options.firstReminderDays &&
          typeof options.firstReminderDays !== "number") ||
        (options.repeatReminderDays &&
          typeof options.repeatReminderDays !== "number") ||
        typeof options.allowDownloadUnsigned !== "boolean" ||
        typeof options.allowReassign !== "boolean"
      ) {
        throw new Error("Invalid options structure");
      }
      return true;
    }),

  body("fields")
    .if(body("status").equals("Sent"))
    .custom((fields) => {
      // Business Rule: If a package is being sent, EVERY field must have at least one user assigned.
      // An unassigned field on a sent document is an error.
      const unassignedFields = fields.filter(
        (field) => !field.assignedUsers || field.assignedUsers.length === 0
      );

      if (unassignedFields.length > 0) {
        const fieldLabels = unassignedFields
          .map((f) => f.label || f.type)
          .join(", ");
        throw new Error(
          `Cannot send package: The following fields have no users assigned: ${fieldLabels}`
        );
      }
      return true;
    }),
];

const updatePackageValidation = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Package name cannot be empty")
    .trim()
    .isString()
    .withMessage("Package name must be a string"),
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
            typeof field.label === "string" &&
            (!field.assignedUsers ||
              field.assignedUsers.every(assignedUserValidator))
        )
      ) {
        throw new Error("Invalid field or assigned user structure");
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
  body("receivers")
    .optional()
    .isArray()
    .withMessage("Receivers must be an array")
    .custom((receivers) => {
      if (
        !receivers.every(
          (rec) =>
            rec.id && rec.contactId && rec.contactName && rec.contactEmail
        )
      ) {
        throw new Error("Invalid receiver structure");
      }
      return true;
    }),
  body("options")
    .optional()
    .isObject()
    .withMessage("Options must be an object")
    .custom((options) => {
      if (
        (options.expiresAt && isNaN(new Date(options.expiresAt).getTime())) ||
        (options.hasOwnProperty("sendExpirationReminders") &&
          typeof options.sendExpirationReminders !== "boolean") ||
        (options.reminderPeriod &&
          ![
            "1_day_before",
            "2_days_before",
            "1_hour_before",
            "2_hours_before",
          ].includes(options.reminderPeriod)) ||
        (options.hasOwnProperty("sendAutomaticReminders") &&
          typeof options.sendAutomaticReminders !== "boolean") ||
        (options.firstReminderDays &&
          typeof options.firstReminderDays !== "number") ||
        (options.repeatReminderDays &&
          typeof options.repeatReminderDays !== "number") ||
        (options.hasOwnProperty("allowDownloadUnsigned") &&
          typeof options.allowDownloadUnsigned !== "boolean") ||
        (options.hasOwnProperty("allowReassign") &&
          typeof options.allowReassign !== "boolean")
      ) {
        throw new Error("Invalid options structure");
      }
      return true;
    }),
  body("status")
    .optional()
    .isString()
    .withMessage("Status must be a string")
    .isIn(["Draft", "Sent", "Completed", "Archived"])
    .withMessage("Invalid status value"),
  body("fields")
    .optional() // Keep this, as fields are optional on update
    .if(body("status").equals("Sent"))
    .custom((fieldsInBody) => {
      if (!fieldsInBody) {
        // If the 'fields' array isn't part of this update request, we can't validate it.
        // To be absolutely safe, this would require fetching the existing doc, merging fields,
        // and re-validating, but that's a much larger change.
        // For now, we only validate if the fields are passed in the PATCH request.
        return true;
      }

      const unassignedFields = fieldsInBody.filter(
        (field) => !field.assignedUsers || field.assignedUsers.length === 0
      );

      if (unassignedFields.length > 0) {
        const fieldLabels = unassignedFields
          .map((f) => f.label || f.type)
          .join(", ");
        throw new Error(
          `Cannot send package: The following fields have no users assigned: ${fieldLabels}`
        );
      }
      return true;
    }),
];

const packageIdValidation = [
  param("packageId")
    .isMongoId()
    .withMessage("A valid package ID is required in the URL parameter"),
];

const getPackageForParticipantValidation = [
  param("packageId").isMongoId().withMessage("A valid package ID is required."),
  param("participantId")
    .isString()
    .notEmpty()
    .withMessage("A participant ID is required."),
];

const sendOtpValidation = [
  param("packageId").isMongoId().withMessage("Valid package ID required."),
  param("participantId")
    .isString()
    .notEmpty()
    .withMessage("Participant ID required."),
  body("fieldId").isString().notEmpty().withMessage("Field ID required."),
  body("email").isEmail().withMessage("Valid email required."),
];

const verifyOtpValidation = [
  param("packageId").isMongoId().withMessage("Valid package ID required."),
  param("participantId")
    .isString()
    .notEmpty()
    .withMessage("Participant ID required."),
  body("fieldId").isString().notEmpty().withMessage("Field ID required."),
  body("otp")
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits."),
];

// SMS OTP Validations
const sendSmsOtpValidation = [
  param("packageId").isMongoId().withMessage("Valid package ID required."),
  param("participantId")
    .isString()
    .notEmpty()
    .withMessage("Participant ID required."),
  body("fieldId").isString().notEmpty().withMessage("Field ID required."),
  body("phone").isMobilePhone().withMessage("Valid phone number required."),
];

const verifySmsOtpValidation = [
  param("packageId").isMongoId().withMessage("Valid package ID required."),
  param("participantId")
    .isString()
    .notEmpty()
    .withMessage("Participant ID required."),
  body("fieldId").isString().notEmpty().withMessage("Field ID required."),
  body("otp")
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits."),
];

const submitFieldsValidation = [
  param("packageId").isMongoId().withMessage("A valid package ID is required."),
  param("participantId")
    .isString()
    .notEmpty()
    .withMessage("A valid participant ID is required."),
  body("fieldValues")
    .isObject()
    .withMessage("Field values must be provided as an object."),
];

const rejectPackageValidation = [
  param("packageId").isMongoId().withMessage("A valid package ID is required."),
  param("participantId")
    .isString()
    .notEmpty()
    .withMessage("A participant ID is required."),
  body("reason")
    .trim()
    .notEmpty()
    .withMessage("A reason for rejection is required.")
    .isLength({ min: 1, max: 500 })
    .withMessage("The reason must be between 1 and 500 characters."),
];

// Validation for registering a new contact for reassignment
const registerReassignmentContactValidation = [
  param("packageId").isMongoId().withMessage("A valid package ID is required."),
  param("participantId")
    .isString()
    .notEmpty()
    .withMessage("A valid participant ID is required."),
  body("firstName")
    .notEmpty()
    .withMessage("First name is required")
    .trim()
    .isString()
    .withMessage("First name must be a string")
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),
  body("lastName")
    .notEmpty()
    .withMessage("Last name is required")
    .trim()
    .isString()
    .withMessage("Last name must be a string")
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),
  body("email")
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("Email must be less than 100 characters"),
  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .isLength({ max: 100 })
    .withMessage("Title must be less than 100 characters"),
  body("phone")
    .optional()
    .isString()
    .withMessage("Phone must be a string")
    .isLength({ max: 20 })
    .withMessage("Phone must be less than 20 characters"),
];

// Validation for listing reassignment contacts
const listReassignmentContactsValidation = [
  param("packageId").isMongoId().withMessage("A valid package ID is required."),
  param("participantId")
    .isString()
    .notEmpty()
    .withMessage("A valid participant ID is required."),
];

// Validation for performing the reassignment
const performReassignmentValidation = [
  param("packageId").isMongoId().withMessage("A valid package ID is required."),
  param("participantId")
    .isString()
    .notEmpty()
    .withMessage("A valid participant ID is required."),
  body("newContactId")
    .isMongoId()
    .withMessage("A valid new contact ID is required."),
  body("reason")
    .notEmpty()
    .withMessage("A reason for reassignment is required")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Reason must be between 1 and 500 characters."),
];

// Validation for checking reassignment eligibility
const checkReassignmentEligibilityValidation = [
  param("packageId").isMongoId().withMessage("A valid package ID is required."),
  param("participantId")
    .isString()
    .notEmpty()
    .withMessage("A valid participant ID is required."),
];

const getPackagesValidation = [
  // Validate 'status' filter
  query("status")
    .optional()
    .isString()
    .isIn([
      "All",
      "Draft",
      "Pending",
      "Finished",
      "Rejected",
      "Expired",
      "Revoked",
    ])
    .withMessage("Invalid status value."),

  // Validate 'name' filter
  query("name")
    .optional()
    .isString()
    .trim()
    .withMessage("Name filter must be a string."),

  // Validate 'page' for pagination
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer.")
    .toInt(),

  // Validate 'limit' for pagination
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100.")
    .toInt(),

  // Validate 'sortKey' for sorting
  query("sortKey")
    .optional()
    .isIn(["name", "status", "addedOn"])
    .withMessage("Invalid sort key. Must be one of: name, status, addedOn."),

  // Validate 'sortDirection' for sorting
  query("sortDirection")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort direction must be 'asc' or 'desc'."),
];

const revokePackageValidation = [
  param("packageId")
    .isMongoId()
    .withMessage("A valid package ID is required in the URL parameter"),
  body("reason")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("The reason cannot exceed 500 characters."),
];

const manualReminderValidation = [
  param("packageId")
    .isMongoId()
    .withMessage("A valid package ID is required in the URL parameter"),
];
const addReceiverByParticipantValidation = [
  param("packageId").isMongoId().withMessage("A valid package ID is required."),
  param("participantId")
    .isString()
    .notEmpty()
    .withMessage("A valid participant ID is required."),
  body("newContactId")
    .isMongoId()
    .withMessage("A valid new contact ID is required to add a receiver."),
];

module.exports = {
  createPackageValidation,
  updatePackageValidation,
  packageIdValidation,
  getPackageForParticipantValidation,
  sendOtpValidation,
  verifyOtpValidation,
  sendSmsOtpValidation,
  verifySmsOtpValidation,
  submitFieldsValidation,
  rejectPackageValidation,
  registerReassignmentContactValidation,
  listReassignmentContactsValidation,
  performReassignmentValidation,
  checkReassignmentEligibilityValidation,
  getPackagesValidation,
  revokePackageValidation,
  manualReminderValidation,
  addReceiverByParticipantValidation,
};
