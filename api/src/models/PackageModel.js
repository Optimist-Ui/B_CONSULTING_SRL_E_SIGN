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
  signatureMethods: {
    type: [
      {
        type: String,
        enum: ["Email OTP", "SMS OTP"],
      },
    ],
    default: undefined,
    required: function () {
      return this.role === "Signer";
    },
    validate: [
      {
        validator: function (methods) {
          if (this.role === "Signer") {
            return Array.isArray(methods) && methods.length > 0;
          }
          return true;
        },
        message: "Signers must have at least one signature method.",
      },
      {
        validator: function (methods) {
          if (Array.isArray(methods)) {
            return new Set(methods).size === methods.length;
          }
          return true;
        },
        message: "Signature methods cannot contain duplicates.",
      },
    ],
  },
  signed: { type: Boolean, default: false },
  signedAt: { type: Date },
  signedMethod: { type: String },
  signedWithOtp: { type: String },
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
  //Track if expiry reminder has been sent
  expiryReminderSentAt: { type: Date },
  sendAutomaticReminders: { type: Boolean, default: false },
  firstReminderDays: { type: Number },
  repeatReminderDays: { type: Number },
  //Track automatic reminder history
  automaticRemindersSent: [
    {
      sentAt: { type: Date, required: true },
      recipientCount: { type: Number, required: true },
    },
  ],
  allowDownloadUnsigned: { type: Boolean, default: true },
  allowReassign: { type: Boolean, default: true },
  allowReceiversToAdd: { type: Boolean, default: true },
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

const receiverHistorySchema = new Schema({
  addedBy: {
    // The participant who added the new receiver
    participantId: { type: String, required: true },
    contactName: { type: String, required: true },
    contactEmail: { type: String, required: true },
  },
  newReceiver: {
    // The contact who was added
    contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true },
    contactName: { type: String, required: true },
    contactEmail: { type: String, required: true },
  },
  addedAt: { type: Date, default: Date.now },
  addedIP: { type: String },
});

const packageSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    templateId: { type: Schema.Types.ObjectId, ref: "Template" },
    attachment_uuid: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    s3Key: { type: String, required: true },
    fields: [packageFieldSchema],
    receivers: [packageReceiverSchema],
    options: { type: packageOptionsSchema, required: true },
    customMessage: { type: String, trim: true },
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
    // Track when package was sent (for automatic reminders)
    sentAt: { type: Date },
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
    receiverHistory: [receiverHistorySchema],
  },
  { timestamps: true }
);
// Add validation method to schema
packageOptionsSchema.methods.canSendExpiryReminder = function () {
  // Must have expiry enabled
  if (
    !this.expiresAt ||
    !this.sendExpirationReminders ||
    !this.reminderPeriod
  ) {
    return false;
  }

  // Must not have been sent already
  if (this.expiryReminderSentAt) {
    return false;
  }

  // Must not be expired
  if (new Date() >= this.expiresAt) {
    return false;
  }

  return true;
};

packageOptionsSchema.methods.canSendAutomaticReminder = function () {
  if (!this.sendAutomaticReminders || !this.firstReminderDays) {
    return false;
  }

  // Must not be expired (if expiry is set)
  if (this.expiresAt && new Date() >= this.expiresAt) {
    return false;
  }

  return true;
};

// Add index for cron job performance
packageSchema.index({
  "options.expiresAt": 1,
  status: 1,
  "options.expiryReminderSentAt": 1,
});

packageSchema.index({
  status: 1,
  sentAt: 1,
  "options.sendAutomaticReminders": 1,
});

module.exports = mongoose.model("Package", packageSchema);
