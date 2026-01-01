const { body, check } = require("express-validator");

const signupValidation = [
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("language")
    .optional()
    .isIn(["en", "es", "fr", "de", "it", "el"])
    .withMessage("Invalid language code"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),
];

const requestPasswordResetValidation = [
  check("email").isEmail().withMessage("Valid email is required"),
];

const resetPasswordValidation = [
  check("resetToken").notEmpty().withMessage("Reset token is required"),
  check("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

const updateProfileValidation = [
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("phone")
    .optional()
    .isString()
    .withMessage("Phone number must be a valid string"),
  body("language").notEmpty().withMessage("Language is required"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

const requestEmailChangeValidation = [
  body("newEmail")
    .trim()
    .notEmpty()
    .withMessage("New email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

const verifyEmailChangeOtpValidation = [
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only numbers"),

  body("newEmail")
    .trim()
    .notEmpty()
    .withMessage("New email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),
];

const registerDeviceTokenValidation = [
  body("deviceToken")
    .trim()
    .notEmpty()
    .withMessage("Device token is required")
    .isString()
    .withMessage("Device token must be a string"),

  body("platform")
    .trim()
    .notEmpty()
    .withMessage("Platform is required")
    .isIn(["android", "ios"])
    .withMessage("Platform must be 'android' or 'ios'"),
];

const unregisterDeviceTokenValidation = [
  body("deviceToken")
    .trim()
    .notEmpty()
    .withMessage("Device token is required")
    .isString()
    .withMessage("Device token must be a string"),
];

module.exports = {
  signupValidation,
  loginValidation,
  requestPasswordResetValidation,
  resetPasswordValidation,
  changePasswordValidation,
  updateProfileValidation,
  requestEmailChangeValidation,
  verifyEmailChangeOtpValidation,
  registerDeviceTokenValidation,
  unregisterDeviceTokenValidation,
};
