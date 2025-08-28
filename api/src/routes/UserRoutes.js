const express = require("express");
const {
  signupValidation,
  loginValidation,
  requestPasswordResetValidation,
  resetPasswordValidation,
  updateProfileValidation,
  changePasswordValidation,
} = require("../validations/UserValidations");
const validate = require("../middlewares/validate");
const authenticateUser = require("../middlewares/authenticate");
const { uploadProfileImage } = require("../middlewares/upload");

module.exports = (container) => {
  const router = express.Router();
  const userController = container.resolve("userController");

  router.post(
    "/signup",
    signupValidation,
    validate,
    userController.createUser.bind(userController)
  );

  router.post(
    "/login",
    loginValidation,
    validate,
    userController.login.bind(userController)
  );

  router.get(
    "/profile",
    authenticateUser,
    userController.getUserProfile.bind(userController)
  );

  // ---  PROFILE UPDATE ROUTE ---
  router.put(
    "/profile",
    authenticateUser,
    uploadProfileImage,
    updateProfileValidation,
    validate,
    userController.updateUserProfile.bind(userController)
  );

  // --- PASSWORD CHANGE ROUTE ---
  router.put(
    "/password",
    authenticateUser,
    changePasswordValidation,
    validate,
    userController.changePassword.bind(userController)
  );

  router.get("/verify-token/:token", async (req, res) => {
    const user = await container.resolve("userService").User.findOne({
      resetToken: req.params.token,
    });
    res.json({ found: !!user, user });
  });

  // --- ROUTE FOR EMAIL VERIFICATION ---
  router.get(
    "/verify-email/:token", // The link in the email will trigger this
    userController.verifyEmail.bind(userController)
  );

  // Reset Password Routes
  router.post(
    "/request-password-reset",
    requestPasswordResetValidation,
    validate,
    userController.requestPasswordReset.bind(userController)
  );

  router.post(
    "/reset-password",
    resetPasswordValidation,
    validate,
    userController.resetPassword.bind(userController)
  );

  return router;
};
