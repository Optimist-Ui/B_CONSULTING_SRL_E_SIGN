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
      const s3File = req.s3File; // 👈 From uploadAndStoreProfileImage middleware (S3 info)

      const updatedUser = await this.userService.updateUserProfile(
        userId,
        profileData,
        s3File
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

  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const result = await this.userService.deleteAccount(userId);
      return successResponse(
        res,
        result,
        "Account deactivation requested successfully"
      );
    } catch (error) {
      return errorResponse(res, error, "Failed to request account deletion");
    }
  }

  async reactivateAccount(req, res) {
    try {
      const { token } = req.params;
      const result = await this.userService.reactivateAccount(token);
      return successResponse(res, result, "Account reactivated successfully");
    } catch (error) {
      return errorResponse(res, error, "Failed to reactivate account");
    }
  }
  async requestEmailChange(req, res) {
    try {
      const userId = req.user.id;
      const { newEmail } = req.body;

      const result = await this.userService.requestEmailChange(
        userId,
        newEmail
      );
      return successResponse(res, result, "OTP sent to your current email");
    } catch (error) {
      return errorResponse(res, error, "Failed to send OTP");
    }
  }

  async verifyEmailChange(req, res) {
    try {
      const userId = req.user.id;
      const { otp, newEmail } = req.body;

      const updatedUser = await this.userService.verifyEmailChange(
        userId,
        otp,
        newEmail
      );
      return successResponse(res, updatedUser, "Email updated successfully");
    } catch (error) {
      return errorResponse(res, error, "Failed to update email");
    }
  }

  async registerDeviceToken(req, res) {
    try {
      const userId = req.user.id;
      const { deviceToken, platform } = req.body;

      if (!deviceToken || !platform) {
        return errorResponse(
          res,
          new Error("deviceToken and platform are required"),
          "Missing required fields",
          400
        );
      }

      if (!["android", "ios"].includes(platform)) {
        return errorResponse(
          res,
          new Error("Platform must be 'android' or 'ios'"),
          "Invalid platform",
          400
        );
      }

      const result = await this.userService.registerDeviceToken(
        userId,
        deviceToken,
        platform
      );

      return successResponse(
        res,
        result,
        "Device token registered successfully"
      );
    } catch (error) {
      return errorResponse(res, error, "Failed to register device token");
    }
  }

  async unregisterDeviceToken(req, res) {
    try {
      const userId = req.user.id;
      const { deviceToken } = req.body;

      if (!deviceToken) {
        return errorResponse(
          res,
          new Error("deviceToken is required"),
          "Missing device token",
          400
        );
      }

      const result = await this.userService.unregisterDeviceToken(
        userId,
        deviceToken
      );

      return successResponse(
        res,
        result,
        "Device token unregistered successfully"
      );
    } catch (error) {
      return errorResponse(res, error, "Failed to unregister device token");
    }
  }
}

module.exports = UserController;
