// models/Review.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Standard questions for the review. Using a constant ensures consistency.
 */
const REVIEW_QUESTIONS = {
  easeOfUse: "How easy was the platform to use?",
  clarity: "How clear were the instructions?",
  speed: "How would you rate the speed of the process?",
  overall: "What is your overall satisfaction?",
};

const reviewSchema = new Schema(
  {
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "Package",
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The unique ID of the person (participant or owner) who is reviewing.
    reviewerId: {
      type: String,
      required: true,
    },
    // The email of the person who submitted the review. THIS WILL BE OUR UNIQUE IDENTIFIER.
    reviewerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    reviewerName: {
      type: String,
      required: true,
    },
    reviewerRole: {
      type: String,
      enum: ["Initiator", "Signer", "Approver", "FormFiller"],
      required: true,
    },
    // Stores the answers to our standard questions
    answers: {
      easeOfUse: { type: Number, min: 1, max: 5, required: true },
      clarity: { type: Number, min: 1, max: 5, required: true },
      speed: { type: Number, min: 1, max: 5, required: true },
      overall: { type: Number, min: 1, max: 5, required: true },
    },
    // The calculated average rating from the answers
    averageRating: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      maxLength: 2000,
    },
  },
  { timestamps: true }
);

// A reviewer can only review a specific package once.
reviewSchema.index({ packageId: 1, reviewerEmail: 1 }, { unique: true });

// Attach the questions to the model for easy access elsewhere
reviewSchema.statics.getQuestions = () => REVIEW_QUESTIONS;

module.exports = mongoose.model("Review", reviewSchema);
