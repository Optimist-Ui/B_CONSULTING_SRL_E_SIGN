const express = require("express");
const {
  createSubscriptionValidation,
  createTrialSubscriptionValidation,
} = require("../validations/SubscriptionValidations");
const authenticateUser = require("../middlewares/authenticate");
const validate = require("../middlewares/validate");

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: API for managing plans and user subscriptions.
 */

module.exports = (container) => {
  const router = express.Router();
  const subscriptionController = container.resolve("subscriptionController");

  /**
   * @swagger
   * /api/plans:
   *   get:
   *     tags: [Subscriptions]
   *     summary: Get all available subscription plans
   *     description: Retrieves a list of all publicly available subscription plans.
   *     security: [] # This is a public endpoint
   *     responses:
   *       '200':
   *         description: A list of available plans.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Plan'
   */
  router.get("/", subscriptionController.getPlans.bind(subscriptionController));

  // --- All routes below require a logged-in user ---
  router.use(authenticateUser);

  /**
   * @swagger
   * /api/plans/status:
   *   get:
   *     tags: [Subscriptions]
   *     summary: Get user's subscription status
   *     description: Retrieves the current subscription status for the authenticated user.
   *     responses:
   *       '200':
   *         description: The user's current subscription details.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Subscription'
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: User has no active subscription.
   */
  router.get(
    "/status",
    subscriptionController.getSubscriptionStatus.bind(subscriptionController)
  );

  /**
   * @swagger
   * /api/plans/create-trial:
   *   post:
   *     tags: [Subscriptions]
   *     summary: Create a trial subscription
   *     description: Starts a new trial subscription for the user. A valid payment method is required for verification.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateSubscriptionInput'
   *     responses:
   *       '201':
   *         description: Trial subscription created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Subscription'
   *       '400':
   *         description: Validation error or trial eligibility failed.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: User has already had a trial.
   */
  router.post(
    "/create-trial",
    createTrialSubscriptionValidation,
    validate,
    subscriptionController.createTrialSubscription.bind(subscriptionController)
  );

  /**
   * @swagger
   * /api/plans/create:
   *   post:
   *     tags: [Subscriptions]
   *     summary: Create a paid subscription
   *     description: Creates a new paid subscription for the authenticated user.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateSubscriptionInput'
   *     responses:
   *       '201':
   *         description: Subscription created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Subscription'
   *       '400':
   *         description: Validation error or payment failure.
   *       '401':
   *         description: Unauthorized.
   *       '409':
   *         description: User already has an active subscription.
   */
  router.post(
    "/create",
    createSubscriptionValidation,
    validate,
    subscriptionController.createSubscription.bind(subscriptionController)
  );

  /**
   * @swagger
   * /api/plans/my-subscription:
   *   get:
   *     tags: [Subscriptions]
   *     summary: Get current subscription details
   *     description: Retrieves the detailed information of the user's current subscription.
   *     responses:
   *       '200':
   *         description: Detailed subscription object.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Subscription'
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: No active subscription found.
   */
  router.get(
    "/my-subscription",
    subscriptionController.getSubscription.bind(subscriptionController)
  );

  /**
   * @swagger
   * /api/plans/end-trial:
   *   patch:
   *     tags: [Subscriptions]
   *     summary: End trial period early
   *     description: Immediately ends the user's trial period and converts it to a full, active subscription.
   *     responses:
   *       '200':
   *         description: Trial ended successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Subscription'
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: User is not currently in a trial period.
   */
  router.patch(
    "/end-trial",
    subscriptionController.endTrial.bind(subscriptionController)
  );

  /**
   * @swagger
   * /api/plans/cancel:
   *   patch:
   *     tags: [Subscriptions]
   *     summary: Cancel a subscription
   *     description: Cancels the user's active subscription at the end of the current billing period.
   *     responses:
   *       '200':
   *         description: Subscription canceled successfully. The subscription status will reflect the change.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Subscription'
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: No active subscription to cancel.
   */
  router.patch(
    "/cancel",
    subscriptionController.cancelSubscription.bind(subscriptionController)
  );

  /**
   * @swagger
   * /api/plans/reactivate:
   *   patch:
   *     tags: [Subscriptions]
   *     summary: Reactivate a canceled subscription
   *     description: Reactivates a subscription that was previously canceled but has not yet reached its period end.
   *     responses:
   *       '200':
   *         description: Subscription reactivated successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Subscription'
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Subscription cannot be reactivated (e.g., already active or past period end).
   */
  router.patch(
    "/reactivate",
    subscriptionController.reactivateSubscription.bind(subscriptionController)
  );

  /**
   * @swagger
   * /api/plans/invoices:
   *   get:
   *     tags: [Subscriptions]
   *     summary: List user invoices
   *     description: Retrieves a list of past invoices for the authenticated user.
   *     responses:
   *       '200':
   *         description: A list of the user's invoices.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Invoice'
   *       '401':
   *         description: Unauthorized.
   */
  router.get(
    "/invoices",
    subscriptionController.listInvoices.bind(subscriptionController)
  );

  /**
   * @swagger
   * /api/plans/invoices/{invoiceId}:
   *   get:
   *     tags: [Subscriptions]
   *     summary: Get detailed invoice information
   *     description: Retrieves detailed information for a specific invoice
   *     parameters:
   *       - in: path
   *         name: invoiceId
   *         required: true
   *         schema:
   *           type: string
   *         description: The Viva Wallet transaction ID
   *     responses:
   *       '200':
   *         description: Invoice details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InvoiceDetail'
   *       '401':
   *         description: Unauthorized
   *       '403':
   *         description: Invoice does not belong to user
   *       '404':
   *         description: Invoice not found
   */
  router.get(
    "/invoices/:invoiceId",
    subscriptionController.getInvoiceDetail.bind(subscriptionController)
  );

  return router;
};
