const express = require("express");
const authenticateUser = require("../middlewares/authenticate");
const validate = require("../middlewares/validate");
const {
  createReviewValidation,
  packageIdValidation,
  participantIdValidation,
} = require("../validations/ReviewValidations");

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: API for package reviews
 */
module.exports = (container) => {
  const router = express.Router();
  const reviewController = container.resolve("reviewController");

  /**
   * @swagger
   * /api/reviews/featured:
   *   get:
   *     tags: [Reviews]
   *     summary: Get featured reviews
   *     description: Retrieves a list of curated, high-rated reviews to be displayed publicly. This is a public endpoint.
   *     security: [] # Override global security, this endpoint is public
   *     responses:
   *       '200':
   *         description: A list of featured review objects.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/FeaturedReview'
   */
  router.get(
    "/featured",
    reviewController.getFeaturedReviews.bind(reviewController)
  );

  const sharedValidations = [
    packageIdValidation,
    participantIdValidation,
    validate,
  ];

  /**
   * @swagger
   * /api/reviews/packages/{packageId}/participant/{participantId}/review/eligibility:
   *   get:
   *     tags: [Reviews]
   *     summary: Check if a participant can review a package
   *     description: Checks if a specific participant is eligible to submit a review for a given package. This is a public endpoint.
   *     security: [] # Public endpoint
   *     parameters:
   *       - in: path
   *         name: packageId
   *         required: true
   *         schema: { type: string }
   *         description: The ID of the package.
   *       - in: path
   *         name: participantId
   *         required: true
   *         schema: { type: string }
   *         description: The unique ID of the participant.
   *     responses:
   *       '200':
   *         description: The participant's eligibility status.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Eligibility'
   *       '403':
   *         description: Forbidden - The participant has already reviewed this package.
   *       '404':
   *         description: Not Found - The package or participant does not exist.
   */
  router.get(
    "/packages/:packageId/participant/:participantId/review/eligibility",
    ...sharedValidations,
    reviewController.checkEligibility.bind(reviewController)
  );

  /**
   * @swagger
   * /api/reviews/packages/{packageId}/participant/{participantId}/review:
   *   post:
   *     tags: [Reviews]
   *     summary: Submit a review for a package
   *     description: Allows an eligible participant to submit a review. This is a public endpoint.
   *     security: [] # Public endpoint
   *     parameters:
   *       - in: path
   *         name: packageId
   *         required: true
   *         schema: { type: string }
   *         description: The ID of the package being reviewed.
   *       - in: path
   *         name: participantId
   *         required: true
   *         schema: { type: string }
   *         description: The unique ID of the participant submitting the review.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ReviewInput'
   *     responses:
   *       '201':
   *         description: Review created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Review'
   *       '400':
   *         description: Bad Request - Validation error.
   *       '403':
   *         description: Forbidden - Participant is not eligible to review.
   *       '404':
   *         description: Not Found - The package or participant does not exist.
   */
  router.post(
    "/packages/:packageId/participant/:participantId/review",
    createReviewValidation,
    ...sharedValidations,
    reviewController.createReview.bind(reviewController)
  );

  /**
   * @swagger
   * /api/reviews/packages/{packageId}/reviews:
   *   get:
   *     tags: [Reviews]
   *     summary: Get all reviews for a package (Owner only)
   *     description: Retrieves all reviews submitted for a specific package. Requires authentication as the package owner.
   *     security:
   *       - bearerAuth: [] # This endpoint uses the global security definition
   *     parameters:
   *       - in: path
   *         name: packageId
   *         required: true
   *         schema: { type: string }
   *         description: The ID of the package.
   *     responses:
   *       '200':
   *         description: An array of all reviews for the package.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Review'
   *       '401':
   *         description: Unauthorized - No token or invalid token provided.
   *       '403':
   *         description: Forbidden - The authenticated user is not the owner of the package.
   *       '404':
   *         description: Not Found - The package does not exist.
   */
  router.get(
    "/packages/:packageId/reviews",
    authenticateUser,
    packageIdValidation,
    validate,
    reviewController.getReviewsForPackage.bind(reviewController)
  );

  return router;
};
