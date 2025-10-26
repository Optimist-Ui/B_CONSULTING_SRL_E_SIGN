// src/models/User.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

const subscriptionHistorySchema = new Schema(
  {
    type: {
      type: String,
      enum: ["trial", "paid", "top_up"],
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      sparse: true,
    },
    planName: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    documentLimit: {
      type: Number,
      required: true,
    },
    documentsUsed: {
      type: Number,
      default: 0,
    },
    // No longer needed, calculated dynamically
    // remainingUnits, carryoverUnits, effectiveLimit, finalUsage
    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
    },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    phone: { type: String },
    language: { type: String, default: "en" },
    profileImage: { type: String },
    s3Key: { type: String },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", sparse: true },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      sparse: true,
    },
    verificationTokenExpiresAt: {
      type: Date,
      sparse: true,
    },
    resetToken: { type: String, sparse: true },
    resetTokenExpiresAt: { type: Date, sparse: true },

    // 👇 ADD THESE NEW FIELDS FOR EMAIL CHANGE
    emailChangeOtp: { type: String, sparse: true },
    emailChangeOtpExpiresAt: { type: Date, sparse: true },
    pendingEmail: { type: String, sparse: true }, // Store the new email temporarily
    emailChangeAttempts: { type: Number, default: 0 },

    stripeCustomerId: {
      type: String,
      unique: true,
      sparse: true,
    },
    subscription: {
      subscriptionId: { type: String },
      planId: { type: Schema.Types.ObjectId, ref: "Plan" },
      planName: { type: String },
      status: {
        type: String,
        enum: [
          "trialing",
          "active",
          "past_due",
          "canceled",
          "incomplete",
          "unpaid",
        ],
      },
      current_period_start: { type: Date },
      current_period_end: { type: Date },
      trial_end: { type: Date },
    },
    subscriptionHistory: [subscriptionHistorySchema],
    hasHadTrial: {
      type: Boolean,
      default: false,
    },
    isDeactivated: { type: Boolean, default: false },
    deactivationDate: { type: Date, sparse: true },
    deletionScheduledAt: { type: Date, sparse: true },
    reactivationToken: { type: String, sparse: true },
    reactivationExpiresAt: { type: Date, sparse: true },
  },
  { timestamps: true }
);

// Add indexes for performance
userSchema.index({ "subscription.subscriptionId": 1 });
userSchema.index({ "subscription.status": 1 });

/**
 * NEW: Calculates total document limit from all active history entries.
 */
userSchema.methods.getTotalDocumentLimit = function () {
  if (!this.subscriptionHistory || this.subscriptionHistory.length === 0)
    return 0;
  return this.subscriptionHistory.reduce((total, entry) => {
    if (entry.status === "active") {
      return total + (entry.documentLimit || 0);
    }
    return total;
  }, 0);
};

/**
 * NEW: Calculates total documents used across all active history entries.
 */
userSchema.methods.getTotalDocumentsUsed = function () {
  if (!this.subscriptionHistory || this.subscriptionHistory.length === 0)
    return 0;
  return this.subscriptionHistory.reduce((total, entry) => {
    if (entry.status === "active") {
      return total + (entry.documentsUsed || 0);
    }
    return total;
  }, 0);
};

/**
 * REWRITTEN: Calculates remaining documents by checking all active history entries.
 * This correctly handles stacked limits from top-ups.
 */
userSchema.methods.getRemainingDocuments = function () {
  if (
    !this.subscription ||
    !["active", "trialing"].includes(this.subscription.status)
  ) {
    return 0;
  }
  const totalLimit = this.getTotalDocumentLimit();
  const totalUsed = this.getTotalDocumentsUsed();
  return Math.max(0, totalLimit - totalUsed);
};

/**
 * REWRITTEN: Checks if a user is able to create a document.
 */
userSchema.methods.canCreateDocument = function () {
  if (
    !this.subscription ||
    !["active", "trialing"].includes(this.subscription.status)
  ) {
    return false;
  }
  return this.getRemainingDocuments() > 0;
};

/**
 * NEW: Intelligently increments the document usage count on the correct
 * history entry (uses the one with the earliest start date first).
 */
userSchema.methods.incrementDocumentUsage = function () {
  if (!this.canCreateDocument()) {
    return false; // Cannot increment if limit is reached
  }

  // Find the first active history entry that still has capacity
  const activeEntries = this.subscriptionHistory
    .filter((h) => h.status === "active")
    .sort((a, b) => a.startDate - b.startDate); // Use oldest credits first

  for (const entry of activeEntries) {
    if (entry.documentsUsed < entry.documentLimit) {
      entry.documentsUsed += 1;
      return true; // Successfully incremented
    }
  }

  return false; // Should not happen if canCreateDocument is true, but for safety
};

// virtual for getting signed URL
userSchema.virtual("profileImageUrl").get(function () {
  // This will be populated dynamically in the service
  return this._profileImageUrl || this.profileImage;
});

// Ensure virtuals are included when converting to JSON
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
