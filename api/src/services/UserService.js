const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { generateToken } = require("../utils/jwtHandler");

class UserService {
  constructor({ User, emailService }) {
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

    await this.User.findOneAndUpdate(
      { resetToken: resetToken },
      {
        $set: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiresAt: null,
        },
      },
      { new: true }
    );

    // --- TRIGGER THE SUCCESS EMAIL ---
    // Call the new email service method to notify the user
    await this.emailService.sendPasswordResetSuccessEmail(user);

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

    // --- NEW BUSINESS RULE ---
    if (currentPassword === newPassword) {
      throw new Error("The new password cannot be the same as the old one.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await this.emailService.sendPasswordResetSuccessEmail(user);

    return { message: "Your password has been changed successfully." };
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
}

module.exports = UserService;
