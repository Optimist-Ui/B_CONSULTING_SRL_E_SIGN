// src/routes/WebhookRoutes.js

const express = require("express");

module.exports = (container) => {
  const router = express.Router();
  const webhookController = container.resolve("webhookController");

  /**
   * GET: Viva Wallet webhook verification
   * Viva Wallet will call this endpoint to verify your webhook URL
   */
  router.get(
    "/vivawallet",
    webhookController.verifyWebhookEndpoint.bind(webhookController)
  );

  /**
   * POST: Viva Wallet webhook events
   * This receives actual webhook events from Viva Wallet
   */
  router.post(
    "/vivawallet",
    express.json({ type: "application/json" }), // Parse JSON body
    webhookController.handleVivaWalletWebhook.bind(webhookController)
  );

  return router;
};
