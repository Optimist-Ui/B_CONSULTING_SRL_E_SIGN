const express = require("express");
const authenticateUser = require("../middlewares/authenticate");
const validate = require("../middlewares/validate");
const {
  paymentMethodIdBodyValidation,
  paymentMethodIdParamValidation,
} = require("../validations/SubscriptionValidations");

/**
 * @swagger
 * tags:
 *   name: Payment Methods
 *   description: API for managing a user's payment methods. Requires authentication.
 */

module.exports = (container) => {
  const router = express.Router();
  const paymentMethodController = container.resolve("paymentMethodController");

  // All payment method routes require an authenticated user.
  router.use(authenticateUser);

  /**
   * @swagger
   * /api/payment-methods:
   *   get:
   *     tags: [Payment Methods]
   *     summary: List a user's saved payment methods
   *     description: Retrieves a list of all payment methods saved by the authenticated user in Stripe.
   *     responses:
   *       '200':
   *         description: A list of payment methods.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/PaymentMethod'
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal Server Error.
   */
  router.get("/", paymentMethodController.list.bind(paymentMethodController));

  /**
   * @swagger
   * /api/payment-methods/attach:
   *   post:
   *     tags: [Payment Methods]
   *     summary: Attach a new payment method
   *     description: Attaches a new payment method (created on the client-side) to the authenticated user's Stripe customer profile.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PaymentMethodIdInput'
   *     responses:
   *       '200':
   *         description: The newly attached payment method.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaymentMethod'
   *       '400':
   *         description: Bad Request - Validation error.
   *       '401':
   *         description: Unauthorized.
   */
  router.post(
    "/attach",
    paymentMethodIdBodyValidation,
    validate,
    paymentMethodController.attach.bind(paymentMethodController)
  );

  /**
   * @swagger
   * /api/payment-methods/set-default:
   *   patch:
   *     tags: [Payment Methods]
   *     summary: Set a default payment method
   *     description: Marks a specified payment method as the default for future subscription payments.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PaymentMethodIdInput'
   *     responses:
   *       '200':
   *         description: Success message indicating the default was updated.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Default payment method updated successfully."
   *       '400':
   *         description: Bad Request - Validation error or invalid payment method ID.
   *       '401':
   *         description: Unauthorized.
   */
  router.patch(
    "/set-default",
    paymentMethodIdBodyValidation,
    validate,
    paymentMethodController.setDefault.bind(paymentMethodController)
  );

  /**
   * @swagger
   * /api/payment-methods/{paymentMethodId}:
   *   delete:
   *     tags: [Payment Methods]
   *     summary: Detach a payment method
   *     description: Detaches and removes a payment method from the user's Stripe customer profile.
   *     parameters:
   *       - in: path
   *         name: paymentMethodId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the Stripe Payment Method to detach (e.g., pm_1J...).
   *     responses:
   *       '204':
   *         description: No Content - The payment method was detached successfully.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Not Found - The payment method ID does not exist or does not belong to the user.
   */
  router.delete(
    "/:paymentMethodId",
    paymentMethodIdParamValidation,
    validate,
    paymentMethodController.detach.bind(paymentMethodController)
  );

  return router;
};
