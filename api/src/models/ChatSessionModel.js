// api/src/models/ChatSessionModel.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      confidence: { type: Number, min: 0, max: 1 },
      tokens: { type: Number },
      model: { type: String },
    },
  },
  { timestamps: true, _id: false }
);

const chatSessionSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
      index: true,
    },
    language: {
      type: String,
      default: "en",
      enum: ["en", "fr", "nl", "de", "es", "it"],
    },
    messages: [messageSchema],
    status: {
      type: String,
      enum: ["active", "resolved", "escalated", "abandoned"],
      default: "active",
      index: true,
    },
    metadata: {
      userAgent: { type: String },
      ipAddress: { type: String },
      page: { type: String },
      referrer: { type: String },
      deviceType: {
        type: String,
        enum: ["desktop", "mobile", "tablet", "unknown"],
      },
    },
    userSatisfaction: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String, maxlength: 500 },
      ratedAt: { type: Date },
    },
    escalatedToHelpRequest: {
      type: Schema.Types.ObjectId,
      ref: "HelpRequest",
      sparse: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for performance
chatSessionSchema.index({ createdAt: -1 });
chatSessionSchema.index({ status: 1, createdAt: -1 });
chatSessionSchema.index({ userId: 1, createdAt: -1 });

// Method to add a message
chatSessionSchema.methods.addMessage = function (role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    metadata,
    createdAt: new Date(),
  });
  this.lastMessageAt = new Date();
};

// Virtual for message count
chatSessionSchema.virtual("messageCount").get(function () {
  return this.messages.length;
});

// Ensure virtuals are included
chatSessionSchema.set("toJSON", { virtuals: true });
chatSessionSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("ChatSession", chatSessionSchema);