const mongoose = require("mongoose");
const { Schema } = mongoose;

const assignedUserSchema = new Schema({
  id: { type: String, required: true },
  contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true },
  contactName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  role: {
    type: String,
    enum: ["Signer", "FormFiller", "Approver"],
    required: true,
  },
  signatureMethod: {
    type: String,
    enum: ["Email OTP", "SMS OTP"],
    required: function () {
      return this.role === "Signer";
    },
  },
  signed: { type: Boolean, default: false },
  signedAt: { type: Date },
  signedMethod: { type: String },
  signedIP: { type: String },
});

const packageReceiverSchema = new Schema({
  id: { type: String, required: true },
  contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true },
  contactName: { type: String, required: true },
  contactEmail: { type: String, required: true },
});

const packageFieldSchema = new Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "text",
      "signature",
      "checkbox",
      "radio",
      "textarea",
      "date",
      "dropdown",
    ],
    required: true,
  },
  page: { type: Number, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  required: { type: Boolean, default: false },
  label: { type: String, required: true },
  placeholder: { type: String, default: "" },
  options: [
    {
      value: { type: String, required: true },
      label: { type: String, required: true },
    },
  ],
  groupId: { type: String },
  assignedUsers: [assignedUserSchema],
  value: {
    type: Schema.Types.Mixed,
    default: undefined,
  },
});

const packageOptionsSchema = new Schema({
  expiresAt: { type: Date },
  sendExpirationReminders: { type: Boolean, default: false },
  reminderPeriod: {
    type: String,
    enum: [
      "1_day_before",
      "2_days_before",
      "1_hour_before",
      "2_hours_before",
      null,
    ],
    default: null,
  },
  sendAutomaticReminders: { type: Boolean, default: false },
  firstReminderDays: { type: Number },
  repeatReminderDays: { type: Number },
  allowDownloadUnsigned: { type: Boolean, default: true },
  allowReassign: { type: Boolean, default: true },
});

// New schema for auditing reassignments
const reassignmentHistorySchema = new Schema({
  reassignedFrom: {
    contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
    contactName: { type: String },
    contactEmail: { type: String },
  },
  reassignedTo: {
    contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
    contactName: { type: String },
    contactEmail: { type: String },
  },
  reassignedBy: {
    // The participant who initiated the reassignment
    participantId: { type: String }, // The unique ID of their assignment
    contactName: { type: String },
    contactEmail: { type: String },
  },
  reason: { type: String, required: true },
  reassignedAt: { type: Date, default: Date.now },
  reassignedIP: { type: String },
});

const packageSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    templateId: { type: Schema.Types.ObjectId, ref: "Template" },
    attachment_uuid: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    fields: [packageFieldSchema],
    receivers: [packageReceiverSchema],
    options: { type: packageOptionsSchema, required: true },
    status: {
      type: String,
      enum: [
        "Draft",
        "Sent",
        "Completed",
        "Archived",
        "Rejected",
        "Expired",
        "Revoked",
      ],
      default: "Draft",
    },
    rejectionDetails: {
      rejectedBy: {
        contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
        contactName: { type: String },
        contactEmail: { type: String },
      },
      reason: { type: String },
      rejectedAt: { type: Date },
      rejectedIP: { type: String },
    },
    revocationDetails: {
      revokedBy: {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        name: { type: String },
        email: { type: String },
      },
      reason: { type: String }, // Optional reason provided by initiator
      revokedAt: { type: Date },
      revokedIP: { type: String },
    },

    // Add reassignment history tracking
    reassignmentHistory: [reassignmentHistorySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
