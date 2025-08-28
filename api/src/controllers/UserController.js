const { successResponse, errorResponse } = require("../utils/responseHandler");

class UserController {
  constructor({ userService }) {
    this.userService = userService;
  }

  async createUser(req, res) {
    try {
      const { user, token } = await this.userService.createUser(req.body);
      return successResponse(
        res,
        { user, token },
        "User created successfully",
        201
      );
    } catch (error) {
      return errorResponse(res, error, "Failed to create user");
    }
  }

  async login(req, res) {
    try {
      const { user, token } = await this.userService.login(req.body);
      return successResponse(
        res,
        { user, token },
        "User logged in successfully"
      );
    } catch (error) {
      return errorResponse(res, error, "Failed to log in");
    }
  }

  // ---  PROFILE UPDATE CONTROLLER ---
  async updateUserProfile(req, res) {
    try {
      const userId = req.user.id; // From authenticateUser middleware
      const profileData = req.body;
      const file = req.file; // From upload.js (multer) middleware

      const updatedUser = await this.userService.updateUserProfile(
        userId,
        profileData,
        file
      );

      return successResponse(res, updatedUser, "Profile updated successfully");
    } catch (error) {
      return errorResponse(res, error, "Failed to update profile");
    }
  }

  // ---  VERIFY EMAIL CONTROLLER METHOD ---
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      const result = await this.userService.verifyEmail(token);
      return successResponse(res, result, "Email verified successfully");
    } catch (error) {
      return errorResponse(res, error, "Failed to verify email");
    }
  }

  async getUserProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await this.userService.getUserProfile(userId);
      return successResponse(res, user, "User profile fetched successfully");
    } catch (error) {
      return errorResponse(res, error, "Failed to fetch user profile");
    }
  }

  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;
      const response = await this.userService.requestPasswordReset(email);
      return successResponse(res, response, "Password reset email sent");
    } catch (error) {
      return errorResponse(res, error, "Failed to send password reset email");
    }
  }

  async resetPassword(req, res) {
    try {
      const { resetToken, newPassword } = req.body;

      if (!resetToken || !newPassword) {
        return res
          .status(400)
          .json({ message: "Missing token or new password" });
      }
      const response = await this.userService.resetPassword(
        resetToken,
        newPassword
      );
      return successResponse(res, response, "Password reset successful");
    } catch (error) {
      return errorResponse(res, error, "Failed to reset password");
    }
  }

  // --- PASSWORD CHANGE CONTROLLER METHOD ---
  async changePassword(req, res) {
    try {
      const userId = req.user.id; // From authenticateUser middleware
      const passwordData = req.body;

      const response = await this.userService.changePassword(
        userId,
        passwordData
      );

      return successResponse(res, response, "Password changed successfully");
    } catch (error) {
      return errorResponse(res, error, "Failed to change password");
    }
  }
}

module.exports = UserController;
