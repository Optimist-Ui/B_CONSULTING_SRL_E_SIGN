// src/controllers/WebhookController.js

const vivaConfig = require("../config/vivaWalletConfig");
const { successResponse, errorResponse } = require("../utils/responseHandler");

class WebhookController {
  constructor({ vivaWalletPaymentService, vivaWalletWebhookHandler }) {
    this.vivaWalletPaymentService = vivaWalletPaymentService;
    this.webhookHandler = vivaWalletWebhookHandler;
  }

  /**
   * 🔐 Viva Wallet Webhook Verification (GET request)
   * This is called by Viva Wallet to verify your webhook endpoint
   */
  async verifyWebhookEndpoint(req, res) {
    try {
      console.log("🔐 Viva Wallet webhook verification requested");

      const verificationUrl = `${vivaConfig.checkoutURL}/api/messages/config/token`;
      const client = vivaConfig.createBasicAuthClient();

      const response = await client.get(verificationUrl);

      console.log("✅ Webhook verification successful");
      return res.status(200).json({ Key: response.data.Key });
    } catch (error) {
      console.error("❌ Webhook verification failed:", error.message);
      return res.status(500).json({ error: "Verification failed" });
    }
  }

  /**
   * 📨 Handle Viva Wallet Webhook Events (POST request)
   * Event Types:
   * - 1796: Transaction Payment Created (card verification, subscriptions, renewals)
   * - 1797: Transaction Failed
   * - 1798: Transaction Reversed (Refund)
   */
  async handleVivaWalletWebhook(req, res) {
    try {
      const payload = req.body;

      console.log("📨 Webhook received:", JSON.stringify(payload, null, 2));

      // Validate payload
      if (!payload.EventTypeId && !payload.MessageId) {
        console.error("❌ Invalid webhook payload");
        return errorResponse(res, "Invalid webhook payload", null, 400);
      }

      const eventId = payload.MessageId || payload.EventId;
      const eventTypeId = payload.EventTypeId;

      console.log(`📨 Processing Event: Type ${eventTypeId}, ID ${eventId}`);

      // Handle card verification separately
      if (eventTypeId === 1796) {
        const eventData = payload.EventData || payload;
        const merchantTrns = eventData.MerchantTrns || "";

        if (merchantTrns.startsWith("CARD_VERIFY_")) {
          await this.handleCardVerification(payload);
        }
      }

      // Handle all events through webhook handler
      const result = await this.webhookHandler.handleWebhook(payload);

      // Always return success to Viva Wallet
      return successResponse(res, "Webhook processed successfully", {
        received: true,
        eventId: eventId,
        eventType: eventTypeId,
        processed: result.success,
      });
    } catch (error) {
      console.error("❌ Webhook processing error:", error.message);

      // Still return success to avoid webhook retry storms
      return successResponse(res, "Webhook received (error logged)", {
        received: true,
        error: error.message,
      });
    }
  }

  /**
   * Handle card verification webhook (EventTypeId: 1796)
   */
  async handleCardVerification(payload) {
    try {
      const eventData = payload.EventData || payload;
      const transactionId = eventData.TransactionId;
      const merchantTrns = eventData.MerchantTrns;

      console.log(`🔍 Card verification webhook:`, {
        transactionId,
        merchantTrns,
      });

      // Check if this is a card verification transaction
      if (merchantTrns && merchantTrns.startsWith("CARD_VERIFY_")) {
        const userId = merchantTrns.replace("CARD_VERIFY_", "");

        console.log(`💳 Saving payment source for user: ${userId}`);

        await this.vivaWalletPaymentService.savePaymentSource(
          userId,
          transactionId
        );

        console.log(
          `✅ Card saved successfully via webhook for user: ${userId}`
        );
      }
    } catch (error) {
      console.error("❌ Card verification webhook error:", error.message);
      // Don't throw - we want to acknowledge the webhook
    }
  }
}

module.exports = WebhookController;
