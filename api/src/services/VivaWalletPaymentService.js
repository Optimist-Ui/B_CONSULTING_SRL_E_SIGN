// src/services/VivaWalletPaymentService.js

const vivaConfig = require("../config/vivaWalletConfig");

class VivaWalletPaymentService {
  constructor({ User }) {
    this.User = User;
  }

  /**
   * Create a payment order for saving a payment method (with allowRecurring: true)
   */
  async createPaymentOrder(userId, name, email, returnUrl) {
    try {
      const user = await this.User.findById(userId);
      if (!user) throw new Error("User not found");

      const client = await vivaConfig.createAuthenticatedClient();

      const baseUrl =
        returnUrl || process.env.CLIENT_URL || "http://localhost:5173";
      const fullReturnUrl = `${baseUrl}/payment-callback`;

      const verificationAmount = parseInt(process.env.CARD_VERIFICATION_AMOUNT);
      const orderData = {
        amount: verificationAmount, // €1.00 for card verification
        customerTrns: `Card verification for ${name}`,
        customer: {
          email: email || user.email,
          fullName: name || `${user.firstName} ${user.lastName}`,
          phone: user.phone || "0000000000",
          countryCode: "GR",
          requestLang: "en-US",
        },
        paymentTimeout: 1800, // 30 minutes
        preauth: false,
        allowRecurring: true, // 🎯 KEY: Enable recurring payments
        sourceCode: vivaConfig.sourceCode,
        merchantTrns: `CARD_VERIFY_${userId}`, // Tag for webhook identification
        tags: [`userId:${userId}`, "type:card_verification"],
        sourceUrl: fullReturnUrl,
      };

      console.log("🔄 Creating Viva Wallet payment order...");
      const response = await client.post("/checkout/v2/orders", orderData);

      console.log(`✅ Payment order created: ${response.data.orderCode}`);

      // Save customer ID if not already saved
      if (!user.vivaWalletCustomerId) {
        user.vivaWalletCustomerId = response.data.customerCode || email;
        await user.save();
      }

      return {
        orderCode: response.data.orderCode,
        checkoutUrl: `${vivaConfig.checkoutURL}/web/checkout?ref=${response.data.orderCode}`,
      };
    } catch (error) {
      console.error("❌ Create payment order failed:", error.message);
      throw new Error(
        `Failed to create payment order: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Save payment source after successful payment (called from webhook)
   * ✅ FIXED: Uses Atomic Update to prevent duplicates during race conditions
   */
  async savePaymentSource(userId, transactionId) {
    try {
      // 1. Fetch transaction details from Viva Wallet FIRST
      // We do this before DB operations to ensure we have valid data
      const client = await vivaConfig.createAuthenticatedClient();

      const txResponse = await client.get(
        `/checkout/v2/transactions/${transactionId}`
      );
      const transaction = txResponse.data;

      // 2. Verify transaction success
      if (transaction.statusId !== "F") {
        throw new Error(
          `Transaction not successful. Status: ${transaction.statusId}`
        );
      }

      // 3. Prepare Card Data
      const last4 = transaction.cardNumber?.slice(-4) || "XXXX";
      const cardNumber = transaction.cardNumber || "";
      let cardType = "Unknown";
      if (cardNumber.startsWith("4")) cardType = "Visa";
      else if (cardNumber.startsWith("5")) cardType = "Mastercard";
      else if (cardNumber.startsWith("3")) cardType = "Amex";
      else if (cardNumber.startsWith("6")) cardType = "Discover";

      const newSource = {
        id: `viva_${transactionId}`,
        transactionId: transactionId,
        cardType: cardType,
        last4: last4,
        expiryMonth: transaction.cardExpirationMonth,
        expiryYear: transaction.cardExpirationYear,
        // We temporarily set false, we will handle default logic in the update
        isDefault: false,
        createdAt: new Date(),
      };

      // 4. ATOMIC UPDATE (The Fix)
      // We try to push the new source ONLY if transactionId does not exist in the array.
      // We also verify the User exists in the same query.
      const updatedUser = await this.User.findOneAndUpdate(
        {
          _id: userId,
          "vivaWalletPaymentSources.transactionId": { $ne: transactionId }, // ✅ GUARD: Prevents duplicates
        },
        {
          $push: { vivaWalletPaymentSources: newSource },
          // Optional: Save customer ID if missing
          ...(transaction.customerCode
            ? { $set: { vivaWalletCustomerId: transaction.customerCode } }
            : {}),
        },
        { new: true } // Return the updated document
      );

      // 5. Handle Result
      if (updatedUser) {
        // ✅ SUCCESS: Card was added

        // Post-hook: specific logic for "First Card is Default"
        // Since we can't do complex logic in $push, we check after update if it's the only card
        if (updatedUser.vivaWalletPaymentSources.length === 1) {
          await this.User.updateOne(
            {
              _id: userId,
              "vivaWalletPaymentSources.transactionId": transactionId,
            },
            { $set: { "vivaWalletPaymentSources.$.isDefault": true } }
          );
          newSource.isDefault = true;
        }

        console.log(
          `✅ [Payment] Card saved: ${cardType} *${last4} (User: ${userId})`
        );

        return {
          paymentSourceId: newSource.id,
          cardType: cardType,
          last4: last4,
          expiryMonth: transaction.cardExpirationMonth,
          expiryYear: transaction.cardExpirationYear,
          isDefault: newSource.isDefault,
        };
      } else {
        // ⚠️ FAILED: User not found OR Card already exists
        // Let's figure out which one
        const userCheck = await this.User.findById(userId);
        if (!userCheck) throw new Error("User not found");

        // Find the existing card to return its details
        const existingCard = userCheck.vivaWalletPaymentSources.find(
          (s) => s.transactionId === transactionId
        );

        return {
          paymentSourceId: existingCard?.id,
          cardType: existingCard?.cardType,
          last4: existingCard?.last4,
          expiryMonth: existingCard?.expiryMonth,
          expiryYear: existingCard?.expiryYear,
          alreadyExists: true,
        };
      }
    } catch (error) {
      console.error("❌❌❌ savePaymentSource ERROR:", error.message);
      throw new Error(
        `Failed to save payment source: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Get all payment sources for a user
   */
  async getPaymentSources(userId) {
    try {
      const user = await this.User.findById(userId);
      if (!user) throw new Error("User not found");

      // ✅ FILTER: Only return REAL payment sources (not invoice-only transactions)
      const realPaymentSources = (user.vivaWalletPaymentSources || []).filter(
        (source) => !source.id.startsWith("invoice_")
      );

      return {
        paymentSources: realPaymentSources,
      };
    } catch (error) {
      console.error("❌ Get payment sources error:", error.message);
      return { paymentSources: [] };
    }
  }

  /**
   * Delete a payment source
   */
  async deletePaymentSource(userId, paymentSourceId) {
    try {
      const user = await this.User.findById(userId);
      if (!user) throw new Error("User not found");

      const deletedCard = user.vivaWalletPaymentSources.find(
        (s) => s.id === paymentSourceId
      );

      if (!deletedCard) {
        throw new Error("Payment source not found");
      }

      // Remove the card
      user.vivaWalletPaymentSources = user.vivaWalletPaymentSources.filter(
        (source) => source.id !== paymentSourceId
      );

      // If the deleted card was default, set a new default
      if (deletedCard.isDefault && user.vivaWalletPaymentSources.length > 0) {
        user.vivaWalletPaymentSources[0].isDefault = true;
      }

      await user.save();

      console.log(
        `✅ Card deleted: ${deletedCard.cardType} ending in ${deletedCard.last4}`
      );

      return { success: true };
    } catch (error) {
      console.error("❌ Delete payment source error:", error.message);
      throw new Error(`Failed to delete payment source: ${error.message}`);
    }
  }

  /**
   * Set a payment source as default
   */
  async setDefaultPaymentSource(userId, paymentSourceId) {
    try {
      const user = await this.User.findById(userId);
      if (!user) throw new Error("User not found");

      const foundSource = user.vivaWalletPaymentSources.find(
        (s) => s.id === paymentSourceId
      );

      if (!foundSource) {
        throw new Error("Payment source not found");
      }

      // Update all sources
      user.vivaWalletPaymentSources.forEach((source) => {
        source.isDefault = source.id === paymentSourceId;
      });

      await user.save();

      console.log(
        `✅ Default card set: ${foundSource.cardType} ending in ${foundSource.last4}`
      );

      return { success: true, defaultPaymentSourceId: paymentSourceId };
    } catch (error) {
      console.error("❌ Set default payment source error:", error.message);
      throw new Error(`Failed to set default payment source: ${error.message}`);
    }
  }

  /**
   * Get the default payment source for a user
   */
  async getDefaultPaymentSource(userId) {
    try {
      const user = await this.User.findById(userId);
      if (!user || !user.vivaWalletPaymentSources?.length) {
        throw new Error("No payment sources found");
      }

      const defaultSource = user.vivaWalletPaymentSources.find(
        (s) => s.isDefault
      );

      return defaultSource
        ? defaultSource.id
        : user.vivaWalletPaymentSources[0].id;
    } catch (error) {
      console.error("❌ Get default payment source error:", error.message);
      throw error;
    }
  }
}

module.exports = VivaWalletPaymentService;
