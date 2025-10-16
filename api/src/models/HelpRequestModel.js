// api/src/models/HelpRequestModel.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

const helpRequestSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    chatSessionRef: {
      type: Schema.Types.ObjectId,
      ref: "ChatSession",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
      index: true,
    },
    contactInfo: {
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      name: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },
    category: {
      type: String,
      required: true,
      enum: [
        "technical_issue",
        "billing_question",
        "feature_request",
        "bug_report",
        "account_help",
        "subscription_help",
        "document_issue",
        "other",
      ],
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "closed"],
      default: "pending",
      index: true,
    },
    conversationHistory: [
      {
        role: { type: String, enum: ["user", "assistant"] },
        content: { type: String },
        timestamp: { type: Date },
      },
    ],
    metadata: {
      userAgent: { type: String },
      ipAddress: { type: String },
      page: { type: String },
      subscriptionPlan: { type: String },
      documentsRemaining: { type: Number },
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
    },
    internalNotes: [
      {
        note: { type: String },
        addedBy: { type: Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    resolvedAt: {
      type: Date,
      sparse: true,
    },
    resolutionNote: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes for performance
helpRequestSchema.index({ createdAt: -1 });
helpRequestSchema.index({ status: 1, priority: -1 });
helpRequestSchema.index({ category: 1, status: 1 });
helpRequestSchema.index({ "contactInfo.email": 1 });

module.exports = mongoose.model("HelpRequest", helpRequestSchema);