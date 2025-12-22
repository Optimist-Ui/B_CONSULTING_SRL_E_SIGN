const express = require("express");
const {
  signupValidation,
  loginValidation,
  requestPasswordResetValidation,
  resetPasswordValidation,
  updateProfileValidation,
  changePasswordValidation,
  requestEmailChangeValidation,
  verifyEmailChangeOtpValidation,
  registerDeviceTokenValidation,
  unregisterDeviceTokenValidation,
} = require("../validations/UserValidations");
const validate = require("../middlewares/validate");
const authenticateUser = require("../middlewares/authenticate");
const { uploadAndStoreProfileImage } = require("../middlewares/upload");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API for user authentication and profile management.
 */

module.exports = (container) => {
  const router = express.Router();
  const userController = container.resolve("userController");

  /**
   * @swagger
   * /api/users/signup:
   *   post:
   *     tags: [Users]
   *     summary: Register a new user
   *     description: Creates a new user account and sends a verification email.
   *     security: [] # Public endpoint
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserInput'
   *     responses:
   *       '201':
   *         description: User created. Returns auth token and user object.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       '400':
   *         description: Validation error.
   *       '409':
   *         description: An account with this email already exists.
   */
  router.post(
    "/signup",
    signupValidation,
    validate,
    userController.createUser.bind(userController)
  );

  /**
   * @swagger
   * /api/users/login:
   *   post:
   *     tags: [Users]
   *     summary: Log in a user
   *     description: Authenticates a user with email and password.
   *     security: [] # Public endpoint
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginInput'
   *     responses:
   *       '200':
   *         description: Login successful. Returns auth token and user object.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       '401':
   *         description: Invalid credentials or email not verified.
   */
  router.post(
    "/login",
    loginValidation,
    validate,
    userController.login.bind(userController)
  );

  /**
   * @swagger
   * /api/users/delete-account:
   *   post:
   *     tags: [Users]
   *     summary: Request account deletion
   *     description: Deactivates the user account, cancels subscription if any, and schedules deletion after 14 days. Sends reactivation email.
   *     responses:
   *       '200':
   *         description: Account deactivation requested successfully.
   *       '401':
   *         description: Unauthorized.
   */
  router.post(
    "/delete-account",
    authenticateUser,
    userController.deleteAccount.bind(userController)
  );

  /**
   * @swagger
   * /api/users/profile:
   *   get:
   *     tags: [Users]
   *     summary: Get user profile
   *     description: Retrieves the profile information of the authenticated user.
   *     responses:
   *       '200':
   *         description: The user's profile data.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       '401':
   *         description: Unauthorized.
   */

  /**
   * @swagger
   * /api/users/request-email-change:
   *   post:
   *     tags: [Users]
   *     summary: Request email change with OTP
   *     description: Sends a 6-digit OTP to the current email address to verify email change request.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [newEmail]
   *             properties:
   *               newEmail:
   *                 type: string
   *                 example: newemail@example.com
   *     responses:
   *       '200':
   *         description: OTP sent to current email.
   *       '400':
   *         description: Email already in use or validation error.
   *       '401':
   *         description: Unauthorized.
   */
  router.post(
    "/request-email-change",
    authenticateUser,
    requestEmailChangeValidation,
    validate,
    userController.requestEmailChange.bind(userController)
  );

  /**
   * @swagger
   * /api/users/verify-email-change:
   *   post:
   *     tags: [Users]
   *     summary: Verify email change OTP
   *     description: Verifies the OTP and updates the user's email address.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [otp, newEmail]
   *             properties:
   *               otp:
   *                 type: string
   *                 example: "123456"
   *               newEmail:
   *                 type: string
   *                 example: newemail@example.com
   *     responses:
   *       '200':
   *         description: Email updated successfully.
   *       '400':
   *         description: Invalid or expired OTP.
   *       '401':
   *         description: Unauthorized.
   */
  router.post(
    "/verify-email-change",
    authenticateUser,
    verifyEmailChangeOtpValidation,
    validate,
    userController.verifyEmailChange.bind(userController)
  );

  router.get(
    "/profile",
    authenticateUser,
    userController.getUserProfile.bind(userController)
  );

  /**
   * @swagger
   * /api/users/profile:
   *   put:
   *     tags: [Users]
   *     summary: Update user profile
   *     description: Updates the authenticated user's profile information. Can also be used to upload a profile image.
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             $ref: '#/components/schemas/UpdateProfileInput'
   *     responses:
   *       '200':
   *         description: The updated user profile.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       '400':
   *         description: Validation error.
   *       '401':
   *         description: Unauthorized.
   */
  router.put(
    "/profile",
    authenticateUser,
    uploadAndStoreProfileImage,
    updateProfileValidation,
    validate,
    userController.updateUserProfile.bind(userController)
  );

  /**
   * @swagger
   * /api/users/password:
   *   put:
   *     tags: [Users]
   *     summary: Change user password
   *     description: Allows an authenticated user to change their password.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ChangePasswordInput'
   *     responses:
   *       '200':
   *         description: Password changed successfully.
   *       '400':
   *         description: New password is the same as the old one or validation fails.
   *       '401':
   *         description: Unauthorized or incorrect current password.
   */
  router.put(
    "/password",
    authenticateUser,
    changePasswordValidation,
    validate,
    userController.changePassword.bind(userController)
  );

  /**
   * @swagger
   * /api/users/verify-email/{token}:
   *   get:
   *     tags: [Users]
   *     summary: Verify email address
   *     description: Verifies a user's email with a token from their inbox.
   *     security: [] # Public endpoint
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *         description: The email verification token.
   *     responses:
   *       '302':
   *         description: Redirects to the frontend login page upon success.
   *       '400':
   *         description: Invalid or expired token.
   */
  router.get(
    "/verify-email/:token",
    userController.verifyEmail.bind(userController)
  );

  /**
   * @swagger
   * /api/users/reactivate/{token}:
   *   get:
   *     tags: [Users]
   *     summary: Reactivate deactivated account
   *     description: Reactivates the account using the token from email, if within grace period.
   *     security: [] # Public endpoint
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *         description: The reactivation token.
   *     responses:
   *       '200':
   *         description: Account reactivated successfully.
   *       '400':
   *         description: Invalid or expired token.
   */
  router.get(
    "/reactivate/:token",
    userController.reactivateAccount.bind(userController)
  );

  /**
   * @swagger
   * /api/users/request-password-reset:
   *   post:
   *     tags: [Users]
   *     summary: Request password reset
   *     description: Sends a password reset link to the user's email.
   *     security: [] # Public endpoint
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/EmailInput'
   *     responses:
   *       '200':
   *         description: If an account with the email exists, a reset link will be sent.
   *       '400':
   *         description: Validation error.
   */
  router.post(
    "/request-password-reset",
    requestPasswordResetValidation,
    validate,
    userController.requestPasswordReset.bind(userController)
  );

  /**
   * @swagger
   * /api/users/verify-token/{token}:
   *   get:
   *     tags: [Users]
   *     summary: Verify a password reset token
   *     description: Checks if a given password reset token is valid and has not expired.
   *     security: [] # Public endpoint
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *         description: The password reset token from the email link.
   *     responses:
   *       '200':
   *         description: Token validity check result.
   *         content:
   *           application/json:
   *             schema:
   *                type: object
   *                properties:
   *                   found:
   *                     type: boolean
   *                     description: "True if the token is valid, false otherwise."
   *       '400':
   *         description: Token is malformed or invalid.
   */
  router.get("/verify-token/:token", async (req, res) => {
    // This is an example of an inline implementation. For consistency, you could move this logic to the controller.
    const user = await container.resolve("userService").User.findOne({
      resetToken: req.params.token,
      resetTokenExpiresAt: { $gt: Date.now() },
    });
    res.json({ found: !!user });
  });

  /**
   * @swagger
   * /api/users/reset-password:
   *   post:
   *     tags: [Users]
   *     summary: Reset password
   *     description: Sets a new password using a valid reset token.
   *     security: [] # Public endpoint
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ResetPasswordInput'
   *     responses:
   *       '200':
   *         description: Password has been reset successfully.
   *       '400':
   *         description: Invalid token, expired token, or validation error.
   */
  router.post(
    "/reset-password",
    resetPasswordValidation,
    validate,
    userController.resetPassword.bind(userController)
  );

  /**
   * @swagger
   * /api/users/device-token:
   *   post:
   *     tags: [Users]
   *     summary: Register device token for push notifications
   *     description: Registers a Firebase Cloud Messaging (FCM) device token for push notifications.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [deviceToken, platform]
   *             properties:
   *               deviceToken:
   *                 type: string
   *                 example: "fcm_token_here"
   *               platform:
   *                 type: string
   *                 enum: [android, ios]
   *                 example: "android"
   *     responses:
   *       '200':
   *         description: Device token registered successfully.
   *       '400':
   *         description: Validation error.
   *       '401':
   *         description: Unauthorized.
   */
  router.post(
    "/device-token",
    authenticateUser,
    registerDeviceTokenValidation,
    validate,
    userController.registerDeviceToken.bind(userController)
  );

  /**
   * @swagger
   * /api/users/device-token:
   *   delete:
   *     tags: [Users]
   *     summary: Unregister device token
   *     description: Removes a Firebase Cloud Messaging (FCM) device token from the user's account.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [deviceToken]
   *             properties:
   *               deviceToken:
   *                 type: string
   *                 example: "fcm_token_here"
   *     responses:
   *       '200':
   *         description: Device token unregistered successfully.
   *       '400':
   *         description: Validation error.
   *       '401':
   *         description: Unauthorized.
   */
  router.delete(
    "/device-token",
    authenticateUser,
    unregisterDeviceTokenValidation,
    validate,
    userController.unregisterDeviceToken.bind(userController)
  );

  return router;
};
