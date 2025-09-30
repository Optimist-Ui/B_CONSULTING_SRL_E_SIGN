const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { generateToken } = require("../utils/jwtHandler");

class UserService {
  constructor({ User, emailService, stripe }) {
    this.stripe = stripe;
    this.User = User;
    this.emailService = emailService;
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

  async updateUserProfile(userId, profileData, file) {
    const { firstName, lastName, phone, language, email } = profileData;

    const user = await this.User.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    // Ensure email is not changed to one that already exists
    if (email !== user.email) {
      const existingUser = await this.User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userId) {
        throw new Error("This email is already in use by another account.");
      }
    }

    // Update fields
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email; // Allow email changes, guarded by the check above
    user.phone = phone;
    user.language = language;

    // If a new file was uploaded, update the image path
    if (file) {
      // Note: In production, you'd store the URL from a cloud service like S3 here
      user.profileImage = `/public/uploads/avatars/${file.filename}`;
    }

    await user.save();
    return this._sanitizeUser(user); // Return the updated, sanitized user data
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

    // SYNC WITH STRIPE: Verify subscription still exists and is valid
    if (user.subscription && user.subscription.subscriptionId) {
      try {
        const stripeSubscription = await this.stripe.subscriptions.retrieve(
          user.subscription.subscriptionId
        );

        // Update local status to match Stripe
        user.subscription.status = stripeSubscription.status;

        // If subscription was externally cancelled or expired, clear it
        if (
          !["active", "trialing", "past_due"].includes(
            stripeSubscription.status
          )
        ) {
          console.log(
            `Subscription status is ${stripeSubscription.status}, clearing local data`
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
        }
      } catch (error) {
        // Subscription doesn't exist in Stripe
        if (error.statusCode === 404) {
          console.log("Subscription not found in Stripe, clearing local data");
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
          throw error;
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
    // This helper method is crucial and used correctly
    const { password, ...userData } = user.toObject();
    return userData;
  }

  async getUserProfile(userId) {
    const user = await this.User.findById(userId).select("-password");
    if (!user) throw new Error("User not found");
    return this._sanitizeUser(user);
  }

  async findUserByStripeCustomerId(stripeCustomerId) {
    try {
      return await this.User.findOne({ stripeCustomerId });
    } catch (error) {
      console.error("Error finding user by Stripe customer ID:", error);
      throw error;
    }
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

  /**
   * Cancels subscription immediately.
   */
  async cancelSubscriptionImmediately(userId) {
    const user = await this.User.findById(userId).select(
      "subscription subscriptionHistory"
    );
    if (!user || !user.subscription || !user.subscription.subscriptionId) {
      return;
    }

    try {
      await this.stripe.subscriptions.cancel(user.subscription.subscriptionId);

      // CRITICAL FIX: Also expire all active subscription history
      if (user.subscriptionHistory) {
        user.subscriptionHistory.forEach((entry) => {
          if (entry.status === "active") {
            entry.status = "expired";
            entry.endDate = new Date(); // Mark when it was cancelled
          }
        });
      }

      // Clear subscription and save history changes
      user.subscription = undefined;
      await user.save();
    } catch (error) {
      console.error(`Failed to cancel subscription for user ${userId}:`, error);
    }
  }
}

module.exports = UserService;
