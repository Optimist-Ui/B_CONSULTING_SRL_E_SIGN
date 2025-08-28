// routes/WebhookRoutes.js
const express = require("express");

module.exports = (container) => {
  const router = express.Router();
  const webhookController = container.resolve("webhookController");

  // POST /api/webhooks/docuseal
  // This endpoint is called by the DocuSeal server.
  router.post(
    "/docuseal",
    webhookController.handleDocuSealWebhook.bind(webhookController)
  );

  return router;
};