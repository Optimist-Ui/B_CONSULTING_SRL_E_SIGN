const mongoose = require("mongoose");
const { Schema } = mongoose;

const usedTrialFingerprintSchema = new Schema(
  {
    fingerprint: {
      type: String,
      required: true,
      unique: true, // Ensures a card can only be used once
      index: true,     // Index for fast lookups
    },
    // You can optionally store which user used this card for auditing purposes
    usedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  { timestamps: true } // timestamps adds createdAt and updatedAt
);

// This ensures that Mongoose handles the creation of the collection if it doesn't exist.
const UsedTrialFingerprint = mongoose.model("UsedTrialFingerprint", usedTrialFingerprintSchema);

module.exports = UsedTrialFingerprint;