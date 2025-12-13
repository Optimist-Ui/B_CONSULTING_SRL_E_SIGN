// src/services/VivaWalletWebhookHandler.js - COMPLETE FIX

class VivaWalletWebhookHandler {
  constructor({
    User,
    Plan,
    emailService,
    vivaWalletSubscriptionService,
    userService,
    planService,
  }) {
    this.User = User;
    this.Plan = Plan;
    this.emailService = emailService;
    this.subscriptionService = vivaWalletSubscriptionService;
    this.userService = userService;
    this.planService = planService;
    this.processedEvents = new Map();
  }

  async handleWebhook(payload) {
    const eventId = payload.EventId || payload.eventId || payload.MessageId;
    if (!eventId) {
      console.error("❌ No EventId in payload:", payload);
      throw new Error("Invalid webhook payload - missing EventId");
    }

    if (this.hasBeenProcessed(eventId)) {
      console.log(`✓ Event ${eventId} already processed`);
      return { success: true, message: "Already processed" };
    }

    try {
      console.log(
        `🔄 Processing Viva webhook: ${payload.EventTypeId} (${eventId})`
      );

      let result;
      switch (payload.EventTypeId) {
        case 1796: // Transaction Payment Created
          result = await this.handleTransactionCreated(payload);
          break;
        case 1797: // Transaction Failed
          result = await this.handleTransactionFailed(payload);
          break;
        case 1798: // Transaction Reversed (Refund)
          result = await this.handleTransactionReversed(payload);
          break;
        default:
          console.log(`ℹ️ Unhandled event type: ${payload.EventTypeId}`);
          result = { success: true, message: "Event type not handled" };
      }

      this.markAsProcessed(eventId);
      return result;
    } catch (error) {
      console.error(`❌ Error processing webhook:`, error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Handle transaction created - separate card saving from transaction tracking
   */
  async handleTransactionCreated(payload) {
    try {
      const eventData = payload.EventData || payload;
      const transactionId = eventData.TransactionId;
      const merchantTrns = eventData.MerchantTrns || "";
      const statusId = eventData.StatusId;
      const amount = eventData.Amount;

      console.log(`📨 Transaction created: ${transactionId}`);
      console.log(
        `   Status: ${statusId}, Amount: €${(amount / 100).toFixed(2)}`
      );
      console.log(`   Merchant Trns: ${merchantTrns}`);

      if (statusId !== "F") {
        console.log(
          `⚠️ Transaction ${transactionId} not successful (Status: ${statusId})`
        );
        return { success: true, message: "Transaction not successful yet" };
      }

      // ✅ Card verification - handled separately, don't duplicate here
      if (merchantTrns.startsWith("CARD_VERIFY_")) {
        console.log(`✓ Card verification transaction: ${transactionId}`);
        return { success: true, message: "Card verification processed" };
      }

      // ✅ For subscription payments, save for invoices only
      const userId = this.extractUserIdFromMerchantTrns(merchantTrns);
      if (userId) {
        await this.saveTransactionForInvoices(userId, eventData);
      }

      if (merchantTrns.startsWith("NEW_SUB_")) {
        await this.handleNewSubscriptionConfirmation(merchantTrns, eventData);
        return { success: true, message: "New subscription confirmed" };
      }

      if (
        merchantTrns.startsWith("TRIAL_CONVERT_") ||
        merchantTrns.startsWith("TRIAL_TO_PAID_")
      ) {
        await this.handleTrialConversionConfirmation(merchantTrns, eventData);
        return { success: true, message: "Trial conversion confirmed" };
      }

      if (merchantTrns.startsWith("PLAN_CHANGE_")) {
        console.log(`✓ Plan change transaction logged: ${transactionId}`);
        return { success: true, message: "Plan change logged" };
      }

      if (
        merchantTrns.startsWith("RENEWAL_") ||
        merchantTrns.startsWith("AUTO_RENEWAL_")
      ) {
        console.log(`✓ Renewal transaction logged: ${transactionId}`);
        return { success: true, message: "Renewal logged" };
      }

      console.log(`ℹ️ Transaction ${transactionId} processed`);
      return { success: true, message: "Transaction processed" };
    } catch (error) {
      console.error("❌ Error handling transaction created:", error);
      throw error;
    }
  }
  /**
   * ✅ NEW: Save for invoices ONLY (uses 'invoice_' prefix)
   */
  async saveTransactionForInvoices(userId, eventData) {
    try {
      const transactionId = eventData.TransactionId;

      console.log(
        `📋 Adding transaction ${transactionId} for invoices (user ${userId})`
      );

      const user = await this.User.findById(userId);
      if (!user) {
        console.error(`User ${userId} not found`);
        return;
      }

      // Check if already added
      const alreadyAdded = user.vivaWalletPaymentSources?.some(
        (ps) => ps.transactionId === transactionId
      );

      if (alreadyAdded) {
        console.log(`   ℹ️  Transaction ${transactionId} already tracked`);
        return;
      }

      const cardLast4 = eventData.CardNumber?.slice(-4) || "****";
      const cardType = this.getCardTypeName(
        eventData.CardTypeId,
        eventData.BankId
      );

      // ✅ Use 'invoice_' prefix to mark as invoice-only
      await this.User.findByIdAndUpdate(userId, {
        $push: {
          vivaWalletPaymentSources: {
            id: `invoice_${transactionId}`,
            transactionId: transactionId,
            cardType: cardType,
            last4: cardLast4,
            isDefault: false,
            createdAt: new Date(),
          },
        },
      });

      console.log(`   ✅ Transaction added for invoice tracking`);
    } catch (error) {
      console.error(`   ❌ Error saving transaction:`, error);
    }
  }

  /**
   * ✅ NEW: Extract userId from MerchantTrns
   */
  extractUserIdFromMerchantTrns(merchantTrns) {
    if (!merchantTrns) return null;

    const patterns = [
      /NEW_SUB_([a-f0-9]{24})_/,
      /TRIAL_CONVERT_([a-f0-9]{24})_/,
      /TRIAL_TO_PAID_([a-f0-9]{24})_/,
      /PLAN_CHANGE_([a-f0-9]{24})_/,
      /RENEWAL_([a-f0-9]{24})_/,
      /AUTO_RENEWAL_([a-f0-9]{24})_/,
      /CARD_VERIFY_([a-f0-9]{24})$/,
    ];

    for (const pattern of patterns) {
      const match = merchantTrns.match(pattern);
      if (match) return match[1];
    }

    return null;
  }
  /**
   * ✅ NEW: Save transaction to user's payment sources for invoice listing
   */
  async saveTransactionToPaymentSources(userId, eventData) {
    try {
      const transactionId = eventData.TransactionId;

      console.log(
        `💾 Saving transaction ${transactionId} to payment sources for user ${userId}`
      );

      const user = await this.User.findById(userId);
      if (!user) {
        console.error(`User ${userId} not found when saving transaction`);
        return;
      }

      // Check if this transaction is already saved
      const existingTransaction = user.vivaWalletPaymentSources?.find(
        (ps) => ps.transactionId === transactionId
      );

      if (existingTransaction) {
        console.log(`   ℹ️ Transaction ${transactionId} already saved`);
        return;
      }

      // Extract card info from transaction
      const cardLast4 = eventData.CardNumber?.slice(-4) || "****";
      const cardType = this.getCardTypeName(
        eventData.CardTypeId,
        eventData.BankId
      );

      // Add transaction to payment sources
      await this.User.findByIdAndUpdate(userId, {
        $push: {
          vivaWalletPaymentSources: {
            id: transactionId, // Use transactionId as ID
            transactionId: transactionId,
            cardType: cardType,
            last4: cardLast4,
            isDefault: false, // Keep existing default
            createdAt: new Date(),
          },
        },
      });

      console.log(
        `   ✅ Transaction ${transactionId} saved to payment sources`
      );
    } catch (error) {
      console.error(
        `   ❌ Error saving transaction to payment sources:`,
        error
      );
      // Don't throw - this is non-critical
    }
  }

  /**
   * Helper to get card type name
   */
  getCardTypeName(cardTypeId, bankId) {
    if (bankId?.includes("VISA")) return "Visa";
    if (bankId?.includes("MASTERCARD")) return "Mastercard";
    if (bankId?.includes("AMEX")) return "American Express";

    switch (cardTypeId) {
      case 0:
        return "Visa";
      case 1:
        return "Credit Card";
      case 2:
        return "Debit Card";
      default:
        return "Card";
    }
  }

  /**
   * Send confirmation email for new subscriptions
   */
  async handleNewSubscriptionConfirmation(merchantTrns, eventData) {
    try {
      const userId = this.extractUserIdFromMerchantTrns(merchantTrns);
      if (!userId) {
        console.warn(`⚠️ Could not extract userId from: ${merchantTrns}`);
        return;
      }

      console.log(
        `📧 Sending new subscription confirmation for user ${userId}`
      );

      const user = await this.userService.findUserById(userId);
      if (!user || !user.subscription) {
        console.warn(`⚠️ User or subscription not found: ${userId}`);
        return;
      }

      const plan = await this.planService.findPlanById(
        user.subscription.planId
      );
      if (!plan) {
        console.warn(`⚠️ Plan not found for user: ${userId}`);
        return;
      }

      await this.emailService.sendSubscriptionConfirmation(
        user,
        plan.name,
        eventData.Amount / 100,
        user.subscription.current_period_end,
        null
      );

      console.log(`✅ Email sent to ${user.email}`);
    } catch (error) {
      console.error(`❌ Error sending confirmation:`, error);
    }
  }

  /**
   * Send confirmation email for trial conversions
   */
  async handleTrialConversionConfirmation(merchantTrns, eventData) {
    try {
      const userId = this.extractUserIdFromMerchantTrns(merchantTrns);
      if (!userId) {
        console.warn(`⚠️ Could not extract userId from: ${merchantTrns}`);
        return;
      }

      console.log(`📧 Sending trial conversion email for user ${userId}`);

      const user = await this.userService.findUserById(userId);
      if (!user || !user.subscription) {
        console.warn(`⚠️ User or subscription not found: ${userId}`);
        return;
      }

      const plan = await this.planService.findPlanById(
        user.subscription.planId
      );
      if (!plan) {
        console.warn(`⚠️ Plan not found for user: ${userId}`);
        return;
      }

      await this.emailService.sendTrialToActiveTransitionEmail(
        user,
        plan.name,
        user.subscription.current_period_start,
        user.subscription.current_period_end,
        eventData.Amount / 100,
        null
      );

      console.log(`✅ Trial conversion email sent to ${user.email}`);
    } catch (error) {
      console.error(`❌ Error sending trial conversion email:`, error);
    }
  }

  async handleTransactionFailed(payload) {
    try {
      const eventData = payload.EventData || payload;
      const transactionId = eventData.TransactionId;
      const merchantTrns = eventData.MerchantTrns || "";
      const errorText = eventData.ErrorText || "Payment failed";

      console.log(`❌ Transaction failed: ${transactionId}`);
      console.log(`   Error: ${errorText}`);
      console.log(`   Merchant Trns: ${merchantTrns}`);

      if (
        merchantTrns.startsWith("RENEWAL_") ||
        merchantTrns.startsWith("AUTO_RENEWAL_")
      ) {
        console.log(
          `⚠️ Renewal failure logged (cron will handle): ${transactionId}`
        );
      }

      return { success: true, message: "Transaction failure logged" };
    } catch (error) {
      console.error("❌ Error handling transaction failed:", error);
      throw error;
    }
  }

  async handleTransactionReversed(payload) {
    try {
      const eventData = payload.EventData || payload;
      const transactionId = eventData.TransactionId;
      const merchantTrns = eventData.MerchantTrns || "";

      console.log(`↺ Transaction reversed (refund): ${transactionId}`);
      console.log(`   Merchant Trns: ${merchantTrns}`);

      const user = await this.User.findOne({
        "subscription.subscriptionId": transactionId,
      });

      if (user) {
        user.subscriptionHistory.forEach((entry) => {
          if (entry.status === "active") {
            entry.status = "expired";
            entry.endDate = new Date();
          }
        });

        await this.userService.updateUser(user._id, {
          "subscription.status": "canceled",
          subscriptionHistory: user.subscriptionHistory,
        });

        console.log(
          `🔄 Subscription cancelled for user ${user._id} due to refund`
        );

        try {
          const plan = await this.planService.findPlanById(
            user.subscription.planId
          );
          await this.emailService.sendCancellationConfirmation(
            user,
            plan?.name || "Your subscription",
            user.subscription.current_period_end
          );
        } catch (emailError) {
          console.error(`Failed to send cancellation email:`, emailError);
        }
      }

      return { success: true, message: "Transaction reversal processed" };
    } catch (error) {
      console.error("❌ Error handling transaction reversed:", error);
      throw error;
    }
  }

  // Idempotency helpers
  hasBeenProcessed(eventId) {
    const processed = this.processedEvents.has(eventId);
    const now = Date.now();

    for (const [id, timestamp] of this.processedEvents.entries()) {
      if (now - timestamp > 24 * 60 * 60 * 1000) {
        this.processedEvents.delete(id);
      }
    }

    return processed;
  }

  markAsProcessed(eventId) {
    this.processedEvents.set(eventId, Date.now());
  }
}

module.exports = VivaWalletWebhookHandler;
