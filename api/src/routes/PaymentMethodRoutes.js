// src/routes/PaymentMethodRoutes.js

const express = require("express");
const authenticateUser = require("../middlewares/authenticate");
const validate = require("../middlewares/validate");
const { body, param } = require("express-validator");

/**
 * @swagger
 * tags:
 *   name: Payment Methods
 *   description: API for managing user payment methods with Viva Wallet
 */

module.exports = (container) => {
  const router = express.Router();
  const paymentMethodController = container.resolve("paymentMethodController");

  // All routes require authentication
  router.use(authenticateUser);

  /**
   * @swagger
   * /api/payment-methods:
   *   get:
   *     tags: [Payment Methods]
   *     summary: List saved payment methods
   *     description: Retrieves all payment methods saved by the authenticated user
   *     responses:
   *       '200':
   *         description: A list of payment methods
   *       '401':
   *         description: Unauthorized
   */
  router.get("/", paymentMethodController.list.bind(paymentMethodController));

  /**
   * @swagger
   * /api/payment-methods/create-order:
   *   post:
   *     tags: [Payment Methods]
   *     summary: Create a payment order for adding a card
   *     description: Creates a Viva Wallet payment order. User will be redirected to Viva Wallet checkout.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: John Doe
   *               email:
   *                 type: string
   *                 example: john@example.com
   *               returnUrl:
   *                 type: string
   *                 example: https://yourapp.com/payment-callback
   *     responses:
   *       '201':
   *         description: Payment order created
   *       '401':
   *         description: Unauthorized
   */
  router.post(
    "/create-order",
    [
      body("name").optional().isString().trim(),
      body("email").optional().isEmail(),
      body("returnUrl").optional().isURL(),
    ],
    validate,
    paymentMethodController.createOrder.bind(paymentMethodController)
  );

  /**
   * @swagger
   * /api/payment-methods/set-default:
   *   patch:
   *     tags: [Payment Methods]
   *     summary: Set a default payment method
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               paymentSourceId:
   *                 type: string
   *                 example: viva_abc123
   *     responses:
   *       '200':
   *         description: Default payment method updated
   *       '401':
   *         description: Unauthorized
   */
  router.patch(
    "/set-default",
    [body("paymentSourceId").isString().notEmpty()],
    validate,
    paymentMethodController.setDefault.bind(paymentMethodController)
  );

  /**
   * @swagger
   * /api/payment-methods/{paymentSourceId}:
   *   delete:
   *     tags: [Payment Methods]
   *     summary: Delete a payment method
   *     parameters:
   *       - in: path
   *         name: paymentSourceId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       '200':
   *         description: Payment method removed
   *       '401':
   *         description: Unauthorized
   */
  router.delete(
    "/:paymentSourceId",
    [param("paymentSourceId").isString().notEmpty()],
    validate,
    paymentMethodController.detach.bind(paymentMethodController)
  );

  return router;
};
