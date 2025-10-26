// api/src/models/ChatMetricsModel.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

const chatMetricsSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    // Daily aggregated metrics
    totalSessions: {
      type: Number,
      default: 0,
    },
    totalMessages: {
      type: Number,
      default: 0,
    },
    totalTokensUsed: {
      type: Number,
      default: 0,
    },
    avgMessagesPerSession: {
      type: Number,
      default: 0,
    },
    avgConfidence: {
      type: Number,
      default: 0,
    },
    // Session outcomes
    resolvedSessions: {
      type: Number,
      default: 0,
    },
    escalatedSessions: {
      type: Number,
      default: 0,
    },
    abandonedSessions: {
      type: Number,
      default: 0,
    },
    // Language breakdown
    languageDistribution: {
      en: { type: Number, default: 0 },
      fr: { type: Number, default: 0 },
      nl: { type: Number, default: 0 },
      de: { type: Number, default: 0 },
      es: { type: Number, default: 0 },
      it: { type: Number, default: 0 },
    },
    // Device breakdown
    deviceDistribution: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 },
      unknown: { type: Number, default: 0 },
    },
    // User satisfaction
    avgRating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    ratingDistribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
    // Top categories queried
    topCategories: [
      {
        category: String,
        count: Number,
      },
    ],
    // Peak hours (0-23)
    hourlyDistribution: {
      type: Map,
      of: Number,
      default: {},
    },
    // Cost tracking
    estimatedCost: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for performance
chatMetricsSchema.index({ date: -1 });
chatMetricsSchema.index({ date: -1, totalSessions: -1 });

// Static method to aggregate daily metrics
chatMetricsSchema.statics.aggregateDailyMetrics = async function (date) {
  const ChatSession = mongoose.model("ChatSession");
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const sessions = await ChatSession.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  if (sessions.length === 0) return null;

  // Calculate metrics
  const totalSessions = sessions.length;
  const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);
  const totalTokens = sessions.reduce(
    (sum, s) =>
      sum +
      s.messages.reduce((mSum, m) => mSum + (m.metadata?.tokens || 0), 0),
    0
  );

  const avgMessagesPerSession = totalMessages / totalSessions;
  
  const confidenceScores = sessions
    .flatMap((s) => s.messages)
    .map((m) => m.metadata?.confidence)
    .filter((c) => c !== undefined);
  
  const avgConfidence =
    confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : 0;

  // Count outcomes
  const resolvedSessions = sessions.filter((s) => s.status === "resolved").length;
  const escalatedSessions = sessions.filter((s) => s.status === "escalated").length;
  const abandonedSessions = sessions.filter((s) => s.status === "abandoned").length;

  // Language distribution
  const languageDistribution = { en: 0, fr: 0, nl: 0, de: 0, es: 0, it: 0 };
  sessions.forEach((s) => {
    if (languageDistribution[s.language] !== undefined) {
      languageDistribution[s.language]++;
    }
  });

  // Device distribution
  const deviceDistribution = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
  sessions.forEach((s) => {
    const device = s.metadata?.deviceType || "unknown";
    if (deviceDistribution[device] !== undefined) {
      deviceDistribution[device]++;
    }
  });

  // Rating metrics
  const ratedSessions = sessions.filter((s) => s.userSatisfaction?.rating);
  const totalRatings = ratedSessions.length;
  const avgRating =
    totalRatings > 0
      ? ratedSessions.reduce((sum, s) => sum + s.userSatisfaction.rating, 0) /
        totalRatings
      : 0;

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratedSessions.forEach((s) => {
    ratingDistribution[s.userSatisfaction.rating]++;
  });

  // Estimated cost (rough estimate: $0.002 per 1000 tokens for gpt-4o-mini)
  const estimatedCost = (totalTokens / 1000) * 0.002;

  // Create or update metrics document
  const metrics = await this.findOneAndUpdate(
    { date: startOfDay },
    {
      date: startOfDay,
      totalSessions,
      totalMessages,
      totalTokensUsed: totalTokens,
      avgMessagesPerSession,
      avgConfidence,
      resolvedSessions,
      escalatedSessions,
      abandonedSessions,
      languageDistribution,
      deviceDistribution,
      avgRating,
      totalRatings,
      ratingDistribution,
      estimatedCost,
    },
    { upsert: true, new: true }
  );

  return metrics;
};

module.exports = mongoose.model("ChatMetrics", chatMetricsSchema);