// routes/reviewRoutes.js
const express = require("express");
const authenticateUser = require("../middlewares/authenticate");
const validate = require("../middlewares/validate");
const {
  createReviewValidation,
  packageIdValidation,
  participantIdValidation,
} = require("../validations/ReviewValidations");

module.exports = (container) => {
  const router = express.Router();
  const reviewController = container.resolve("reviewController");

  // GET /api/reviews/featured
  // This route is public and does not use any authentication or validation middleware.
  // It should be defined before any routes with similar path structures if applicable.
  router.get(
    "/featured",
    reviewController.getFeaturedReviews.bind(reviewController)
  );

  const sharedValidations = [
    packageIdValidation,
    participantIdValidation,
    validate,
  ];

  // Anyone with the correct link can check their eligibility.
  router.get(
    "/packages/:packageId/participant/:participantId/review/eligibility",
    ...sharedValidations,
    reviewController.checkEligibility.bind(reviewController)
  );

  // Anyone with the correct link can submit a review.
  router.post(
    "/packages/:packageId/participant/:participantId/review",
    createReviewValidation, // This now comes before validate
    ...sharedValidations, // Apply the shared validations
    reviewController.createReview.bind(reviewController)
  );

  // 🔒 SECURE ROUTE: Only the package owner (who is authenticated) can see all reviews.
  // We apply the middleware directly to this specific route.
  router.get(
    "/packages/:packageId/reviews",
    authenticateUser, // <-- Middleware applied here
    packageIdValidation,
    validate,
    reviewController.getReviewsForPackage.bind(reviewController)
  );

  return router;
};
