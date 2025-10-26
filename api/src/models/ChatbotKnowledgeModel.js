// api/src/models/ChatbotKnowledgeModel.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

const chatbotKnowledgeSchema = new Schema(
  {
    category: {
      type: String,
      required: true,
      enum: [
        "e-signing",
        "subscriptions",
        "features",
        "troubleshooting",
        "account",
        "security",
        "general",
      ],
      index: true,
    },
    subcategory: {
      type: String,
      index: true,
    },
    question: {
      type: String,
      required: true,
      text: true, // Enable text search
    },
    answer: {
      type: String,
      required: true,
      text: true, // Enable text search
    },
    translations: {
      fr: { type: String },
      nl: { type: String },
      de: { type: String },
      es: { type: String },
      it: { type: String },
    },
    keywords: [
      {
        type: String,
        lowercase: true,
      },
    ],
    priority: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
      index: true,
    },
    planSpecific: [
      {
        type: String,
        enum: ["Starter", "Pro", "Enterprise"],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    relatedQuestions: [
      {
        type: Schema.Types.ObjectId,
        ref: "ChatbotKnowledge",
      },
    ],
  },
  { timestamps: true }
);

// Text index for search
chatbotKnowledgeSchema.index({
  question: "text",
  answer: "text",
  keywords: "text",
});

// Compound indexes
chatbotKnowledgeSchema.index({ category: 1, priority: -1 });
chatbotKnowledgeSchema.index({ isActive: 1, priority: -1 });

module.exports = mongoose.model("ChatbotKnowledge", chatbotKnowledgeSchema);