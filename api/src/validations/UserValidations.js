const { body, check } = require("express-validator");

const signupValidation = [
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
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

module.exports = {
  signupValidation,
  loginValidation,
  requestPasswordResetValidation,
  resetPasswordValidation,
  changePasswordValidation,
  updateProfileValidation,
};
