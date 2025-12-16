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

      const orderData = {
        amount: 100, // €1.00 for card verification
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
   * ✅ ENHANCED: Better error handling and logging
   */
  async savePaymentSource(userId, transactionId) {
    try {
      console.log(
        `🔄 savePaymentSource called for user ${userId}, transaction ${transactionId}`
      );

      const user = await this.User.findById(userId);
      if (!user) {
        console.error(`❌ User ${userId} not found`);
        throw new Error("User not found");
      }

      console.log(`✅ User found: ${user.email}`);

      if (!user.vivaWalletPaymentSources) {
        user.vivaWalletPaymentSources = [];
        console.log(`📝 Initialized empty payment sources array`);
      }

      // Check if transaction already processed
      const existingByTransaction = user.vivaWalletPaymentSources.find(
        (source) => source.transactionId === transactionId
      );

      if (existingByTransaction) {
        console.log(`⚠️ Transaction ${transactionId} already processed`);
        return {
          paymentSourceId: existingByTransaction.id,
          cardType: existingByTransaction.cardType,
          last4: existingByTransaction.last4,
          expiryMonth: existingByTransaction.expiryMonth,
          expiryYear: existingByTransaction.expiryYear,
          alreadyExists: true,
        };
      }

      // Fetch transaction details from Viva Wallet
      const client = await vivaConfig.createAuthenticatedClient();
      console.log(
        `🔄 Fetching transaction ${transactionId} details from Viva Wallet API...`
      );

      const txResponse = await client.get(
        `/checkout/v2/transactions/${transactionId}`
      );
      const transaction = txResponse.data;

      console.log(
        `📊 Transaction API Response:`,
        JSON.stringify(transaction, null, 2)
      );
      console.log(`📊 Transaction status: ${transaction.statusId}`);

      // Verify transaction is successful
      if (transaction.statusId !== "F") {
        console.error(
          `❌ Transaction not successful. Status: ${transaction.statusId}`
        );
        throw new Error(
          `Transaction not successful. Status: ${transaction.statusId}`
        );
      }

      console.log(`✅ Transaction verified as successful`);

      // Save customer ID if not already saved
      if (!user.vivaWalletCustomerId && transaction.customerCode) {
        user.vivaWalletCustomerId = transaction.customerCode;
        console.log(`📝 Saved customer code: ${transaction.customerCode}`);
      }

      // Detect card type from card number
      const cardNumber = transaction.cardNumber || "";
      let cardType = "Unknown";

      if (cardNumber.startsWith("4")) cardType = "Visa";
      else if (cardNumber.startsWith("5")) cardType = "Mastercard";
      else if (cardNumber.startsWith("3")) cardType = "Amex";
      else if (cardNumber.startsWith("6")) cardType = "Discover";

      const last4 = transaction.cardNumber?.slice(-4) || "XXXX";

      console.log(`💳 Card details: ${cardType} ending in ${last4}`);

      // Check if card already exists (prevent duplicates)
      const existingCard = user.vivaWalletPaymentSources.find(
        (source) => source.last4 === last4 && source.cardType === cardType
      );

      if (existingCard) {
        console.log(`⚠️ Card ${cardType} ending in ${last4} already exists`);
        return {
          paymentSourceId: existingCard.id,
          cardType: existingCard.cardType,
          last4: existingCard.last4,
          expiryMonth: existingCard.expiryMonth,
          expiryYear: existingCard.expiryYear,
          alreadyExists: true,
        };
      }

      // Save new card
      const isFirstCard = user.vivaWalletPaymentSources.length === 0;

      const newSource = {
        id: `viva_${transactionId}`,
        transactionId: transactionId,
        cardType: cardType,
        last4: last4,
        expiryMonth: transaction.cardExpirationMonth,
        expiryYear: transaction.cardExpirationYear,
        isDefault: isFirstCard, // First card is default
        createdAt: new Date(),
      };

      console.log(
        `💾 Saving new payment source:`,
        JSON.stringify(newSource, null, 2)
      );

      user.vivaWalletPaymentSources.push(newSource);
      await user.save();

      const totalCards = user.vivaWalletPaymentSources.length;

      console.log(`✅✅✅ CARD SAVED SUCCESSFULLY ✅✅✅`);
      console.log(`   User: ${user.email} (${userId})`);
      console.log(`   Card: ${cardType} ending in ${last4}`);
      console.log(
        `   Expiry: ${transaction.cardExpirationMonth}/${transaction.cardExpirationYear}`
      );
      console.log(`   Is Default: ${isFirstCard}`);
      console.log(`   Total Cards: ${totalCards}`);

      return {
        paymentSourceId: newSource.id,
        cardType: cardType,
        last4: last4,
        expiryMonth: transaction.cardExpirationMonth,
        expiryYear: transaction.cardExpirationYear,
        isDefault: newSource.isDefault,
      };
    } catch (error) {
      console.error("❌❌❌ savePaymentSource ERROR:", error.message);
      console.error("Stack trace:", error.stack);

      if (error.response) {
        console.error(
          "API Error Response:",
          JSON.stringify(error.response.data, null, 2)
        );
        console.error("API Status:", error.response.status);
      }

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
