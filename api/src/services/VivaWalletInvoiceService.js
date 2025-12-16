// src/services/VivaWalletInvoiceService.js - FIXED WITH CORRECT FIELD NAMES

const vivaConfig = require("../config/vivaWalletConfig");

class VivaWalletInvoiceService {
  constructor({ User }) {
    this.User = User;
  }

  /**
   * ✅ List all invoices/transactions for a user
   */
  async listInvoices(userId) {
    try {
      const user = await this.User.findById(userId).select(
        "vivaWalletCustomerId email vivaWalletPaymentSources"
      );

      if (!user) {
        throw new Error("User not found");
      }

      console.log(`🔍 Fetching invoices for user ${userId}`);
      console.log(`   Email: ${user.email}`);
      console.log(
        `   Payment sources: ${user.vivaWalletPaymentSources?.length || 0}`
      );

      if (
        !user.vivaWalletPaymentSources ||
        user.vivaWalletPaymentSources.length === 0
      ) {
        console.log(`   ℹ️  No payment sources found for user`);
        return [];
      }

      const client = await vivaConfig.createAuthenticatedClient();
      const invoices = [];

      for (const paymentSource of user.vivaWalletPaymentSources) {
        if (!paymentSource.transactionId) {
          console.log(`   ⚠️  Skipping payment source without transaction ID`);
          continue;
        }

        try {
          console.log(
            `   🔄 Fetching transaction: ${paymentSource.transactionId}`
          );

          const response = await client.get(
            `/checkout/v2/transactions/${paymentSource.transactionId}`
          );

          const tx = response.data;
          const transactionId = paymentSource.transactionId;

          console.log(`   ✅ Retrieved transaction ${transactionId}`);
          console.log(
            `      Status: ${tx.statusId}, Amount: €${(tx.amount / 100).toFixed(
              2
            )}`
          );

          // Check for successful payment (statusId: "F" = Finished/Success)
          if (tx.statusId === "F") {
            const invoice = {
              id: transactionId,
              date: tx.insDate,
              amount: (tx.amount / 100).toFixed(2), // ✅ CORRECT: Convert cents to euros HERE
              currency: "EUR",
              status: "paid",
              description: tx.customerTrns || tx.merchantTrns || "Payment",
              transactionType: this.getTransactionType(tx.merchantTrns),
              cardLast4:
                paymentSource.last4 || tx.cardNumber?.slice(-4) || "****",
              cardType:
                paymentSource.cardType ||
                this.getCardType(tx.cardTypeId) ||
                "Card",
              orderCode: tx.orderCode,
              invoiceUrl: this.getInvoiceUrl(transactionId, tx.orderCode),
            };

            invoices.push(invoice);
            console.log(
              `   📄 Invoice added: ${invoice.id} - €${invoice.amount}`
            );
          } else {
            console.log(
              `   ⏭️  Skipping non-successful transaction (status: ${tx.statusId})`
            );
          }
        } catch (error) {
          console.error(
            `   ❌ Error fetching transaction ${paymentSource.transactionId}:`,
            error.message
          );
        }
      }

      // Sort by date (most recent first)
      invoices.sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log(`✅ Fetched ${invoices.length} invoices for user ${userId}`);
      return invoices;
    } catch (error) {
      console.error(`❌ Error fetching invoices for user ${userId}:`, error);
      console.error(`   Error details:`, error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get transaction type from merchant reference
   */
  getTransactionType(merchantTrns) {
    if (!merchantTrns) return "payment";

    if (merchantTrns.startsWith("TRIAL_TO_PAID_")) return "trial_conversion";
    if (merchantTrns.startsWith("TRIAL_CONVERT_")) return "trial_conversion";
    if (merchantTrns.startsWith("NEW_SUB_")) return "new_subscription";
    if (merchantTrns.startsWith("PLAN_CHANGE_")) return "plan_change";
    if (merchantTrns.startsWith("RENEWAL_")) return "renewal";
    if (merchantTrns.startsWith("AUTO_RENEWAL_")) return "renewal";

    return "payment";
  }

  /**
   * Get card type from cardTypeId
   */
  getCardType(cardTypeId) {
    switch (cardTypeId) {
      case 0:
        return "Visa";
      case 1:
        return "Credit";
      case 2:
        return "Debit";
      default:
        return "Card";
    }
  }

  /**
   * Generate invoice/receipt URL for Viva Wallet transaction
   */
  getInvoiceUrl(transactionId, orderCode) {
    const baseUrl = vivaConfig.checkoutURL || "https://demo.vivapayments.com";

    // Option 1: Direct receipt URL (most reliable)
    if (orderCode) {
      return `${baseUrl}/web/checkout/receipt?t=${orderCode}`;
    }

    // Option 2: Transaction details page
    if (transactionId) {
      return `${baseUrl}/transactions?transactionId=${transactionId}`;
    }

    // Fallback
    return `${baseUrl}/transactions`;
  }

  /**
   * ✅ Get a single invoice/transaction by ID
   */
  async getInvoiceById(userId, transactionId) {
    try {
      console.log(
        `🔍 Fetching invoice detail: ${transactionId} for user ${userId}`
      );

      const client = await vivaConfig.createAuthenticatedClient();

      const response = await client.get(
        `/checkout/v2/transactions/${transactionId}`
      );
      const tx = response.data;

      console.log(
        `   ✅ Viva API response received for transaction ${transactionId}`
      );

      // Verify this transaction belongs to the user
      const user = await this.User.findById(userId).select(
        "vivaWalletCustomerId email vivaWalletPaymentSources firstName lastName"
      );

      if (!user) {
        throw new Error("User not found");
      }

      // Check if transaction belongs to user
      const belongsToUser =
        user.vivaWalletPaymentSources?.some(
          (ps) => ps.transactionId === transactionId
        ) ||
        (tx.email && tx.email.toLowerCase() === user.email.toLowerCase()) ||
        (tx.merchantTrns && tx.merchantTrns.includes(userId));

      if (!belongsToUser) {
        console.log(`   ❌ Transaction does not belong to user`);
        throw new Error("Invoice not found or does not belong to user");
      }

      console.log(`   ✅ Transaction verified and belongs to user`);

      // ✅ CORRECT: Convert cents to euros
      return {
        id: transactionId,
        date: tx.insDate,
        amount: (tx.amount / 100).toFixed(2), // ✅ Convert cents to euros
        currency: "EUR",
        status: tx.statusId === "F" ? "paid" : "failed",
        description: tx.customerTrns || tx.merchantTrns || "Payment",
        transactionType: this.getTransactionType(tx.merchantTrns),
        cardLast4: tx.cardNumber?.slice(-4) || "****",
        cardType: this.getCardType(tx.cardTypeId),
        orderCode: tx.orderCode,
        invoiceUrl: this.getInvoiceUrl(transactionId, tx.orderCode),
        fullDetails: tx,
      };
    } catch (error) {
      console.error(`❌ Error fetching invoice ${transactionId}:`, error);
      throw new Error(`Failed to fetch invoice: ${error.message}`);
    }
  }

  /**
   * Get invoice statistics for a user
   */
  async getInvoiceStats(userId) {
    try {
      const invoices = await this.listInvoices(userId);

      const stats = {
        totalInvoices: invoices.length,
        totalPaid: invoices
          .reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
          .toFixed(2),
        lastPaymentDate: invoices.length > 0 ? invoices[0].date : null,
        lastPaymentAmount: invoices.length > 0 ? invoices[0].amount : "0.00",
        byType: {},
      };

      invoices.forEach((inv) => {
        stats.byType[inv.transactionType] =
          (stats.byType[inv.transactionType] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error(`❌ Error getting invoice stats:`, error);
      return {
        totalInvoices: 0,
        totalPaid: "0.00",
        lastPaymentDate: null,
        lastPaymentAmount: "0.00",
        byType: {},
      };
    }
  }
}

module.exports = VivaWalletInvoiceService;
