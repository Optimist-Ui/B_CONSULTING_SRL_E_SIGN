// controllers/WebhookController.js
const { successResponse, errorResponse } = require("../utils/responseHandler");

class WebhookController {
  constructor({ webhookService }) {
    this.webhookService = webhookService;
  }

  async handleDocuSealWebhook(req, res) {
    try {
      // Process the event in the background, but respond to DocuSeal immediately
      // This prevents timeouts if our processing logic takes time.
      this.webhookService.processDocuSealEvent(req.body);

      // Acknowledge receipt of the webhook with a 200 OK
      successResponse(res, { status: "received" }, "Webhook received.");
    } catch (error) {
      // This will only catch errors in the initial handoff, not in the async processing.
      errorResponse(res, error, "Failed to process webhook.");
    }
  }
}

module.exports = WebhookController;