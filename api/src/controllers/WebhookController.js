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
   * ✅ FIXED: Card verification is handled BEFORE the webhook handler
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

      // ✅ FIX: Handle card verification FIRST (before webhook handler)
      if (eventTypeId === 1796) {
        const eventData = payload.EventData || payload;
        const merchantTrns = eventData.MerchantTrns || "";

        // Card verification check
        if (merchantTrns.startsWith("CARD_VERIFY_")) {
          console.log(`💳 Detected card verification transaction`);

          // ✅ CRITICAL: Call savePaymentSource directly here
          await this.handleCardVerification(eventData);

          // Still acknowledge to Viva
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

      // Still return success to avoid webhook retry storms
      return successResponse(res, "Webhook received (error logged)", {
        received: true,
        error: error.message,
      });
    }
  }

  /**
   * ✅ Handle card verification webhook (EventTypeId: 1796)
   * UPDATED: Better error handling and logging
   */
  async handleCardVerification(eventData) {
    try {
      const transactionId = eventData.TransactionId;
      const merchantTrns = eventData.MerchantTrns;
      const statusId = eventData.StatusId;

      console.log(`🔍 Card verification webhook:`, {
        transactionId,
        merchantTrns,
        statusId,
      });

      // Only process successful transactions
      if (statusId !== "F") {
        console.log(
          `⚠️ Transaction ${transactionId} not successful yet (Status: ${statusId})`
        );
        return;
      }

      // Extract userId from merchantTrns
      if (merchantTrns && merchantTrns.startsWith("CARD_VERIFY_")) {
        const userId = merchantTrns.replace("CARD_VERIFY_", "");

        console.log(`💳 Saving payment source for user: ${userId}`);

        // ✅ THIS IS THE KEY CALL
        const result = await this.vivaWalletPaymentService.savePaymentSource(
          userId,
          transactionId
        );

        if (result.alreadyExists) {
          console.log(
            `ℹ️ Card already exists: ${result.cardType} ending in ${result.last4}`
          );
        } else {
          console.log(
            `✅ NEW CARD SAVED: ${result.cardType} ending in ${result.last4}`
          );
          console.log(`   Transaction ID: ${transactionId}`);
          console.log(`   Payment Source ID: ${result.paymentSourceId}`);
          console.log(`   Is Default: ${result.isDefault}`);
        }
      } else {
        console.error(`❌ Invalid merchantTrns format: ${merchantTrns}`);
      }
    } catch (error) {
      console.error("❌ Card verification webhook error:", error.message);
      console.error("Stack trace:", error.stack);
      // Don't throw - we want to acknowledge the webhook
    }
  }
}

module.exports = WebhookController;
