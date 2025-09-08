// controllers/ReviewController.js
const { successResponse, errorResponse } = require("../utils/responseHandler");

class ReviewController {
  constructor({ reviewService }) {
    this.reviewService = reviewService;
  }

  // Works without req.user
  async checkEligibility(req, res) {
    try {
      const { participantId, packageId } = req.params;
      const result = await this.reviewService.checkReviewEligibility(
        participantId,
        packageId
      );
      successResponse(res, result, "Eligibility status fetched successfully.");
    } catch (error) {
      errorResponse(res, error, "Failed to check review eligibility.");
    }
  }

  // Works without req.user
  async createReview(req, res) {
    try {
      const { participantId, packageId } = req.params;
      const review = await this.reviewService.createReview(
        participantId,
        packageId,
        req.body
      );
      successResponse(
        res,
        review,
        "Review submitted successfully, thank you for your feedback!",
        201
      );
    } catch (error) {
      errorResponse(res, error, "Failed to submit review.");
    }
  }

  /**
   * Handles the request to fetch featured reviews for public display.
   */
  async getFeaturedReviews(req, res) {
    try {
      const reviews = await this.reviewService.getFeaturedReviews();
      successResponse(res, reviews, "Featured reviews fetched successfully.");
    } catch (error) {
      errorResponse(res, error, "Failed to fetch featured reviews.");
    }
  }

  // This route is still protected, so it WILL have req.user
  async getReviewsForPackage(req, res) {
    try {
      const userId = req.user.id;
      const { packageId } = req.params;
      const reviews = await this.reviewService.getReviewsForPackage(
        userId,
        packageId
      );
      successResponse(res, reviews, "Reviews fetched successfully.");
    } catch (error) {
      errorResponse(res, error, "Failed to fetch reviews.");
    }
  }
}

module.exports = ReviewController;
