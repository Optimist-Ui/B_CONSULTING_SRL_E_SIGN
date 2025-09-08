const mongoose = require("mongoose");
const { Schema } = mongoose;

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
    language: { type: String, default: "en" }, // Default to English
    profileImage: { type: String }, // Will store the path to the image

    teamId: { type: Schema.Types.ObjectId, ref: "Team", sparse: true }, // A user can belong to one team

    isVerified: {
      type: Boolean,
      default: false, // Users start as unverified
    },
    verificationToken: {
      type: String,
      sparse: true, // Will only be indexed if the value is not null
    },
    verificationTokenExpiresAt: {
      type: Date,
      sparse: true,
    },

    resetToken: { type: String, sparse: true },
    resetTokenExpiresAt: { type: Date, sparse: true },

    // --- Subscription Fields Added Below ---
    stripeCustomerId: {
      type: String,
      unique: true,
      sparse: true, // This means the uniqueness constraint only applies to documents that have this field.
    },
    subscription: {
      subscriptionId: { type: String },
      planId: { type: Schema.Types.ObjectId, ref: "Plan" }, // Reference to our Plan model
      planName: { type: String }, // e.g., "Starter", "Pro"
      status: {
        type: String,
        // trialing, active, past_due, canceled, incomplete
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
    hasHadTrial: {
      type: Boolean,
      default: false, // Business logic: a user gets only one trial
    },
    documentsCreatedThisMonth: {
      type: Number,
      default: 0,
    },
    documentResetDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.index({ resetToken: 1, resetTokenExpiresAt: 1 });

module.exports = mongoose.model("User", userSchema);
