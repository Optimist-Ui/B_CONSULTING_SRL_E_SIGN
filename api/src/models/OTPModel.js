// models/OTP.js (Updated with method field)
const mongoose = require("mongoose");
const { Schema } = mongoose;

const otpSchema = new Schema({
  packageId: { type: Schema.Types.ObjectId, ref: "Package", required: true },
  fieldId: { type: String, required: true },
  participantId: { type: String, required: true },
  otp: { type: String, required: true },
  method: {
    type: String,
    enum: ["Email OTP", "SMS OTP"],
    required: true,
  },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// Auto-expire after 0 seconds past expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient lookups
otpSchema.index({
  packageId: 1,
  fieldId: 1,
  participantId: 1,
  method: 1,
});

module.exports = mongoose.model("OTP", otpSchema);
