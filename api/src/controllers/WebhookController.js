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

      console.log(`🔍 Card verification webhook received:`, {
        transactionId,
        merchantTrns,
        statusId,
        fullEventData: JSON.stringify(eventData, null, 2),
      });

      // ✅ FIX 1: Check if statusId exists
      if (!statusId) {
        console.error(`❌ No statusId in transaction ${transactionId}`);
        return;
      }

      // ✅ FIX 2: Log the exact status
      console.log(
        `📊 Transaction status: "${statusId}" (expecting "F" for success)`
      );

      // Only process successful transactions
      if (statusId !== "F") {
        console.log(
          `⚠️ Transaction ${transactionId} not successful yet (Status: ${statusId}). Waiting for success webhook.`
        );
        return;
      }

      console.log(`✅ Transaction ${transactionId} is successful (Status: F)`);

      // ✅ FIX 3: Validate merchantTrns format
      if (!merchantTrns) {
        console.error(`❌ No merchantTrns in transaction ${transactionId}`);
        return;
      }

      if (!merchantTrns.startsWith("CARD_VERIFY_")) {
        console.error(
          `❌ Invalid merchantTrns format: ${merchantTrns} (expected CARD_VERIFY_*)`
        );
        return;
      }

      // Extract userId
      const userId = merchantTrns.replace("CARD_VERIFY_", "");

      // ✅ FIX 4: Validate userId format (MongoDB ObjectId is 24 hex chars)
      if (!/^[a-f0-9]{24}$/.test(userId)) {
        console.error(`❌ Invalid userId format extracted: ${userId}`);
        return;
      }

      console.log(`💳 Saving payment source for user: ${userId}`);
      console.log(`📝 Transaction ID: ${transactionId}`);

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
        console.log(`✅ ✅ ✅ NEW CARD SAVED SUCCESSFULLY ✅ ✅ ✅`);
        console.log(`   Card Type: ${result.cardType}`);
        console.log(`   Last 4: ${result.last4}`);
        console.log(`   Transaction ID: ${transactionId}`);
        console.log(`   Payment Source ID: ${result.paymentSourceId}`);
        console.log(`   Is Default: ${result.isDefault}`);
        console.log(`   Expiry: ${result.expiryMonth}/${result.expiryYear}`);
      }
    } catch (error) {
      console.error("❌❌❌ Card verification webhook error:", error.message);
      console.error("Stack trace:", error.stack);
      console.error("Event data:", JSON.stringify(eventData, null, 2));
      // Don't throw - we want to acknowledge the webhook
    }
  }
}

module.exports = WebhookController;
