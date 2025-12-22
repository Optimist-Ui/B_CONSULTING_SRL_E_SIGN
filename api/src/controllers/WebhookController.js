// src/controllers/WebhookController.js - FIXED VERSION

const vivaConfig = require("../config/vivaWalletConfig");
const { successResponse, errorResponse } = require("../utils/responseHandler");

class WebhookController {
  constructor({ vivaWalletPaymentService, vivaWalletWebhookHandler }) {
    this.vivaWalletPaymentService = vivaWalletPaymentService;
    this.webhookHandler = vivaWalletWebhookHandler;
  }

  /**
   * 🔐 Viva Wallet Webhook Verification (GET request)
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
   * ✅ FIXED: Better error handling and logging
   */
  async handleVivaWalletWebhook(req, res) {
    try {
      const payload = req.body;

      // Validate payload
      if (!payload.EventTypeId && !payload.MessageId) {
        console.error("❌ Invalid webhook payload");
        return errorResponse(res, "Invalid webhook payload", null, 400);
      }

      const eventId = payload.MessageId || payload.EventId;
      const eventTypeId = payload.EventTypeId;

      // ✅ FIX: Check idempotency globally first
      if (this.webhookHandler.hasBeenProcessed(eventId)) {
        console.log(`✓ Event ${eventId} already processed (Controller Check)`);
        return successResponse(res, "Already processed", { received: true });
      }

      console.log(`📨 Processing Event: Type ${eventTypeId}, ID ${eventId}`);

      // ✅ FIX: Handle card verification FIRST (before webhook handler)
      if (eventTypeId === 1796) {
        const eventData = payload.EventData || payload;
        const merchantTrns = eventData.MerchantTrns || "";

        console.log(
          `🔍 EventTypeId 1796 detected. MerchantTrns: ${merchantTrns}`
        );

        // Card verification check
        if (merchantTrns.startsWith("CARD_VERIFY_")) {
          console.log(`💳 Card verification transaction detected`);

          // ✅ CRITICAL: Call savePaymentSource directly here
          await this.handleCardVerification(eventData);

          // Acknowledge to Viva
          return successResponse(res, "Card verification processed", {
            received: true,
            eventId: eventId,
            eventType: eventTypeId,
            processed: true,
          });
        }
      }

      // Handle all other events through webhook handler
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
      console.error("Stack trace:", error.stack);

      // Still return success to avoid webhook retry storms
      return successResponse(res, "Webhook received (error logged)", {
        received: true,
        error: error.message,
      });
    }
  }

  /**
   * ✅ Handle card verification webhook (EventTypeId: 1796)
   * CRITICAL FIX: Better error handling and detailed logging
   */
  async handleCardVerification(eventData) {
    try {
      const transactionId = eventData.TransactionId;
      const merchantTrns = eventData.MerchantTrns;
      const statusId = eventData.StatusId;

      // REMOVED: Huge console.log of fullEventData
      // REMOVED: "Transaction status expecting F" logs

      if (!statusId || statusId !== "F") {
        // Keep this strictly for debugging failures, or remove if not needed
        // console.log(`⚠️ Transaction ${transactionId} pending/failed (Status: ${statusId})`);
        return;
      }

      if (!merchantTrns || !merchantTrns.startsWith("CARD_VERIFY_")) return;

      const userId = merchantTrns.replace("CARD_VERIFY_", "");

      if (!/^[a-f0-9]{24}$/.test(userId)) {
        console.error(`❌ Invalid userId format in webhook: ${userId}`);
        return;
      }

      // REMOVED: "Saving payment source for user..." (Service handles the log)

      const result = await this.vivaWalletPaymentService.savePaymentSource(
        userId,
        transactionId
      );

      // REMOVED: The second "✅ ✅ ✅ NEW CARD SAVED" block.
      // The Service layer already logs the success. We don't need it twice.
      if (result.alreadyExists) {
        console.log(`ℹ️ [Webhook] Card already exists for User ${userId}`);
      }
    } catch (error) {
      console.error("❌ Card verification webhook error:", error.message);
      // Quietly fail or log to error monitoring service
    }
  }
}

module.exports = WebhookController;
