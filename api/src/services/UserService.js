const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { generateToken } = require("../utils/jwtHandler");

class UserService {
  constructor({
    User,
    emailService,
    s3Service,
  }) {
    this.User = User;
    this.emailService = emailService;
    this.s3Service = s3Service;
  }

  // --- UPDATED createUser METHOD ---
  async createUser(userData) {
    // 1. Check if user already exists
    const existingUser = await this.User.findOne({ email: userData.email });
    if (existingUser) {
      // If user exists and is verified, it's a conflict.
      if (existingUser.isVerified) {
        throw new Error("An account with this email already exists.");
      }
      // If user exists but is not verified, we can allow re-registration to resend verification.
      // This is a design choice. Here we'll just delete the old record.
      await this.User.deleteOne({ _id: existingUser._id });
    }

    // 2. Hash password and create verification token
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiresAt = new Date(Date.now() + 3600000); // Token valid for 1 hour

    // 3. Create the user with verification fields
    const newUser = await this.User.create({
      ...userData,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      verificationTokenExpiresAt,
      language: userData.language || "en",
    });

    // 4. Send the verification email
    await this.emailService.sendVerificationEmail(newUser, verificationToken);

    // 5. DO NOT return a token. Return a success message.
    return {
      message:
        "Registration successful. Please check your email to verify your account.",
    };
  }

  async login({ email, password }) {
    const user = await this.User.findOne({ email });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // --- GATEKEEPER ---
    // Check if the user's account is verified
    if (!user.isVerified) {
      throw new Error(
        "Account not verified. Please check your email for the verification link."
      );
    }

    if (user.isDeactivated) {
      throw new Error(
        "Account is deactivated. Check your email for reactivation instructions."
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    const token = generateToken({ id: user._id, email: user.email });
    return { user: this._sanitizeUser(user), token };
  }

  // --- verifyEmail METHOD ---
  async verifyEmail(verificationToken) {
    const user = await this.User.findOne({
      verificationToken,
      verificationTokenExpiresAt: { $gt: new Date() }, // Check if token is not expired
    });

    if (!user) {
      throw new Error("Invalid or expired verification token.");
    }

    // --- TRIGGER WELCOME EMAIL ---
    // We send the welcome email *before* clearing the user's verification state
    await this.emailService.sendWelcomeEmail(user);

    // Update user to be verified
    user.isVerified = true;
    user.verificationToken = undefined; // Use undefined to remove field
    user.verificationTokenExpiresAt = undefined;

    await user.save();

    return { message: "Email verified successfully. You can now log in." };
  }

  // --- UPDATE USER PROFILE (WITH S3) ---
  async updateUserProfile(userId, profileData, s3File) {
    const { firstName, lastName, phone, language, email } = profileData;

    const user = await this.User.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    // ❌ REMOVE EMAIL UPDATE FROM HERE - it should go through OTP verification
    if (email && email !== user.email) {
      throw new Error(
        "To change your email, please use the email verification process."
      );
    }

    // Update basic fields (email removed)
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (language) user.language = language;

    // Handle profile image upload to S3
    if (s3File) {
      // Delete old profile image from S3 if exists
      if (user.s3Key) {
        try {
          await this.s3Service.deleteFile(user.s3Key);
          console.log(`Deleted old profile image: ${user.s3Key}`);
        } catch (error) {
          console.error("Failed to delete old profile image:", error);
        }
      }

      user.profileImage = s3File.url;
      user.s3Key = s3File.key;
    }

    await user.save();
    return await this._sanitizeUserWithSignedUrl(user);
  }

  async requestPasswordReset(email) {
    const user = await this.User.findOne({ email });
    if (!user) throw new Error("User not found");

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    await this.User.findByIdAndUpdate(
      user._id,
      {
        resetToken: resetToken,
        resetTokenExpiresAt: resetTokenExpiresAt,
      },
      { new: true }
    );

    await this.emailService.sendPasswordResetEmail(user, resetToken);

    return { message: "Password reset email sent" };
  }

  async resetPassword(resetToken, newPassword) {
    const user = await this.User.findOne({
      resetToken: resetToken,
      resetTokenExpiresAt: { $gt: new Date() },
    }).exec();

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Generate new security reset token
    const securityResetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour

    await this.User.findOneAndUpdate(
      { resetToken: resetToken },
      {
        $set: {
          password: hashedPassword,
          resetToken: securityResetToken, // Set new token for security alert
          resetTokenExpiresAt: resetTokenExpiresAt,
        },
      },
      { new: true }
    );

    // Generate the direct reset link
    const resetPasswordUrl = `${process.env.CLIENT_URL}/reset-password/${securityResetToken}`;

    // Send success email with the reset link
    await this.emailService.sendPasswordResetSuccessEmail(
      user,
      resetPasswordUrl
    );

    return { message: "Password reset successful" };
  }

  // --- PASSWORD CHANGE METHOD (FROM PROFILE) ---
  async changePassword(userId, passwordData) {
    const { currentPassword, newPassword } = passwordData;

    const user = await this.User.findById(userId);
    if (!user) throw new Error("User not found.");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error("The current password you entered is incorrect.");
    }

    if (currentPassword === newPassword) {
      throw new Error("The new password cannot be the same as the old one.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Generate security reset token
    const securityResetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Update password and set security reset token
    user.password = hashedPassword;
    user.resetToken = securityResetToken;
    user.resetTokenExpiresAt = resetTokenExpiresAt;
    await user.save();

    // Generate the direct reset link
    const resetPasswordUrl = `${process.env.CLIENT_URL}/reset-password/${securityResetToken}`;

    // Send success email with the reset link
    await this.emailService.sendPasswordResetSuccessEmail(
      user,
      resetPasswordUrl
    );

    return { message: "Your password has been changed successfully." };
  }

  async deleteAccount(userId) {
    const user = await this.User.findById(userId);
    if (!user) throw new Error("User not found");

    // DON'T cancel subscription immediately - let them reactivate within 14 days
    // The cron job will handle cancellation if they don't reactivate

    // Generate reactivation token
    const reactivationToken = crypto.randomBytes(32).toString("hex");
    const reactivationExpiresAt = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000
    ); // 14 days
    const deletionScheduledAt = reactivationExpiresAt;

    user.isDeactivated = true;
    user.deactivationDate = new Date();
    user.deletionScheduledAt = deletionScheduledAt;
    user.reactivationToken = reactivationToken;
    user.reactivationExpiresAt = reactivationExpiresAt;

    await user.save();

    // Send deactivation email with reactivation link
    const reactivationUrl = `${process.env.CLIENT_URL}/reactivate/${reactivationToken}`;
    await this.emailService.sendDeactivationEmail(user, reactivationUrl);

    return {
      message:
        "Account deactivated. Check your email for reactivation instructions.",
    };
  }

  async reactivateAccount(reactivationToken) {
    const user = await this.User.findOne({
      reactivationToken,
      reactivationExpiresAt: { $gt: new Date() },
      isDeactivated: true,
    });

    if (!user) {
      throw new Error("Invalid or expired reactivation token.");
    }

    // ✅ VIVA WALLET: Verify subscription still exists and is valid
    if (user.subscription && user.subscription.subscriptionId) {
      try {
        // Check if subscription is still valid by checking period end
        const now = new Date();
        const periodEnd = user.subscription.current_period_end
          ? new Date(user.subscription.current_period_end)
          : null;

        // If subscription has expired, clear it
        if (!periodEnd || periodEnd < now) {
          console.log(
            `Subscription expired (ended ${periodEnd?.toISOString()}), clearing local data`
          );
          user.subscription = undefined;

          if (user.subscriptionHistory) {
            user.subscriptionHistory.forEach((entry) => {
              if (entry.status === "active") {
                entry.status = "expired";
                entry.endDate = new Date();
              }
            });
          }
        } else {
          // Subscription is still valid, keep current status
          console.log(
            `Subscription still valid until ${periodEnd.toISOString()}`
          );
        }
      } catch (error) {
        console.error("Error checking subscription validity:", error);
        // On error, clear subscription to be safe
        user.subscription = undefined;

        if (user.subscriptionHistory) {
          user.subscriptionHistory.forEach((entry) => {
            if (entry.status === "active") {
              entry.status = "expired";
              entry.endDate = new Date();
            }
          });
        }
      }
    }

    // Reactivate account
    user.isDeactivated = false;
    user.deactivationDate = undefined;
    user.deletionScheduledAt = undefined;
    user.reactivationToken = undefined;
    user.reactivationExpiresAt = undefined;

    await user.save();

    await this.emailService.sendReactivationConfirmationEmail(user);

    return {
      message: "Account reactivated successfully. You can now log in.",
      hasActiveSubscription:
        !!user.subscription &&
        ["active", "trialing"].includes(user.subscription.status),
    };
  }

  _sanitizeUser(user) {
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.resetToken;
    delete userObj.resetTokenExpiresAt;
    delete userObj.verificationToken;
    delete userObj.reactivationToken;
    return userObj;
  }

  // --- HELPER: SANITIZE USER WITH SIGNED URL FOR PROFILE IMAGE ---
  async _sanitizeUserWithSignedUrl(user) {
    const sanitized = this._sanitizeUser(user);

    // Generate signed URL for profile image if S3 key exists
    if (sanitized.s3Key) {
      try {
        sanitized.profileImageUrl = await this.s3Service.getSignedUrl(
          sanitized.s3Key,
          parseInt(process.env.S3_SIGNED_URL_EXPIRY) || 3600 // 1 hour default
        );
      } catch (error) {
        console.error(
          "❌ Failed to generate signed URL for profile image:",
          error
        );
        // If signed URL generation fails, use the S3 URL (won't work if bucket is private)
        sanitized.profileImageUrl = sanitized.profileImage;
      }
    } else if (sanitized.profileImage) {
      // Fallback for old users who might have local file paths
      sanitized.profileImageUrl = sanitized.profileImage;
    }

    return sanitized;
  }

  async getUserProfile(userId) {
    const user = await this.User.findById(userId).select("-password");
    if (!user) throw new Error("User not found");

    return await this._sanitizeUserWithSignedUrl(user);
  }

  async findUserBySubscriptionId(subscriptionId) {
    try {
      return await this.User.findOne({
        "subscription.subscriptionId": subscriptionId,
      });
    } catch (error) {
      console.error("Error finding user by subscription ID:", error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      return await this.User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async findUserById(userId) {
    try {
      return await this.User.findById(userId).populate("subscription.planId");
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw error;
    }
  }

  /**
   * Find users with active subscriptions
   */
  async findUsersWithSubscriptions() {
    return await this.User.find({
      subscription: { $exists: true },
      "subscription.status": { $in: ["active", "trialing"] },
    });
  }

  //  requestEmailChange METHOD ---
  async requestEmailChange(userId, newEmail) {
    const user = await this.User.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    // Check if new email is already in use
    const existingUser = await this.User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error("This email is already in use by another account.");
    }

    // Check if it's the same email
    if (newEmail === user.email) {
      throw new Error("This is already your current email address.");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP and pending email in user document
    user.emailChangeOtp = otp;
    user.emailChangeOtpExpiresAt = expiresAt;
    user.pendingEmail = newEmail;
    user.emailChangeAttempts = 0; // Reset attempts
    await user.save();

    await this.emailService.sendEmailChangeOtp(user, newEmail, otp);

    return {
      message: "OTP sent to your current email address.",
      currentEmail: user.email,
    };
  }

  // --- VERIFY EMAIL CHANGE OTP (UPDATED - Using User Schema) ---
  async verifyEmailChange(userId, otp, newEmail) {
    const user = await this.User.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    // Check if there's a pending email change
    if (!user.emailChangeOtp || !user.pendingEmail) {
      throw new Error("No pending email change request found.");
    }

    // Check if OTP is expired
    if (
      !user.emailChangeOtpExpiresAt ||
      user.emailChangeOtpExpiresAt < new Date()
    ) {
      // Clear the expired OTP data
      user.emailChangeOtp = undefined;
      user.emailChangeOtpExpiresAt = undefined;
      user.pendingEmail = undefined;
      user.emailChangeAttempts = 0;
      await user.save();
      throw new Error("OTP has expired. Please request a new one.");
    }

    // Check attempts (max 5 attempts)
    if (user.emailChangeAttempts >= 5) {
      // Clear the OTP data after too many attempts
      user.emailChangeOtp = undefined;
      user.emailChangeOtpExpiresAt = undefined;
      user.pendingEmail = undefined;
      user.emailChangeAttempts = 0;
      await user.save();
      throw new Error("Too many failed attempts. Please request a new OTP.");
    }

    // Verify OTP
    if (user.emailChangeOtp !== otp) {
      user.emailChangeAttempts += 1;
      await user.save();
      const remainingAttempts = 5 - user.emailChangeAttempts;
      throw new Error(
        `Invalid OTP. You have ${remainingAttempts} attempt(s) remaining.`
      );
    }

    // Verify the new email matches what was stored
    if (user.pendingEmail !== newEmail) {
      throw new Error("Email mismatch. Please request a new OTP.");
    }

    // Check again if new email is still available
    const existingUser = await this.User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error("This email is already in use by another account.");
    }

    // Update the email
    const oldEmail = user.email;
    user.email = newEmail;

    // Clear the OTP fields
    user.emailChangeOtp = undefined;
    user.emailChangeOtpExpiresAt = undefined;
    user.pendingEmail = undefined;
    user.emailChangeAttempts = 0;

    await user.save();

    // Send confirmation email to NEW email
    await this.emailService.sendEmailChangeConfirmation(user);

    // Optionally: Send notification to OLD email
    try {
      await this.emailService.sendEmailChangeNotification(user, oldEmail);
    } catch (error) {
      console.error("Failed to send notification to old email:", error);
      // Don't fail the whole operation if notification fails
    }

    return await this._sanitizeUserWithSignedUrl(user);
  }

  /**
   * Register a device token for push notifications
   * @param {string} userId - User ID
   * @param {string} deviceToken - FCM device token
   * @param {string} platform - Platform ('android' or 'ios')
   * @returns {Promise<Object>} Updated user
   */
  async registerDeviceToken(userId, deviceToken, platform) {
    const user = await this.User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Initialize deviceTokens array if it doesn't exist
    if (!user.deviceTokens) {
      user.deviceTokens = [];
    }

    // Check if token already exists for this user
    const existingToken = user.deviceTokens.find(
      (dt) => dt.token === deviceToken
    );

    if (existingToken) {
      // Update platform and timestamp if token exists
      existingToken.platform = platform;
      existingToken.createdAt = new Date();
    } else {
      // Add new token
      user.deviceTokens.push({
        token: deviceToken,
        platform: platform,
        createdAt: new Date(),
      });
    }

    await user.save();
    return { message: "Device token registered successfully" };
  }

  /**
   * Unregister a device token
   * @param {string} userId - User ID
   * @param {string} deviceToken - FCM device token to remove
   * @returns {Promise<Object>} Result
   */
  async unregisterDeviceToken(userId, deviceToken) {
    const user = await this.User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.deviceTokens || user.deviceTokens.length === 0) {
      return { message: "No device tokens found" };
    }

    // Remove the token
    user.deviceTokens = user.deviceTokens.filter(
      (dt) => dt.token !== deviceToken
    );

    await user.save();
    return { message: "Device token unregistered successfully" };
  }
}

module.exports = UserService;
