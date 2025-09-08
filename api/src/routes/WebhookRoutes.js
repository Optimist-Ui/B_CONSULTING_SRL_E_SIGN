const express = require("express");

module.exports = (container) => {
  const router = express.Router();
  const webhookController = container.resolve("webhookController");

  // Stripe requires the raw body to construct the event
  router.post(
    "/",
    express.raw({ type: "application/json" }), // ✅ Special Middleware!
    webhookController.handleStripeEvents.bind(webhookController)
  );

  return router;
};
