// src/services/VivaWalletInvoiceService.js

const vivaConfig = require("../config/vivaWalletConfig");

class VivaWalletInvoiceService {
  constructor({ User }) {
    this.User = User;
  }

  /**
   * ✅ List all invoices/transactions for a user
   * FIX: Filters out Card Verifications and €0.00/€0.01 transactions
   */
  async listInvoices(userId) {
    try {
      const user = await this.User.findById(userId).select(
        "vivaWalletCustomerId email vivaWalletPaymentSources"
      );

      if (!user) {
        throw new Error("User not found");
      }

      // console.log(`🔍 Fetching invoices for user ${userId}`);

      if (
        !user.vivaWalletPaymentSources ||
        user.vivaWalletPaymentSources.length === 0
      ) {
        return [];
      }

      const client = await vivaConfig.createAuthenticatedClient();
      const invoices = [];

      // Use a Set to prevent duplicate invoices if multiple sources point to the same transaction
      const processedTransactionIds = new Set();

      for (const paymentSource of user.vivaWalletPaymentSources) {
        if (
          !paymentSource.transactionId ||
          processedTransactionIds.has(paymentSource.transactionId)
        ) {
          continue;
        }

        try {
          const response = await client.get(
            `/checkout/v2/transactions/${paymentSource.transactionId}`
          );

          const tx = response.data;
          const transactionId = paymentSource.transactionId;

          // Mark as processed
          processedTransactionIds.add(transactionId);

          // ---------------------------------------------------------
          // 🛑 FILTER LOGIC: Skip Verifications & Micro-transactions
          // ---------------------------------------------------------

          const description = (
            tx.customerTrns ||
            tx.merchantTrns ||
            ""
          ).toLowerCase();
          const amountEur = parseFloat((tx.amount).toFixed(2));
          const type = this.getTransactionType(tx.merchantTrns);

          // 1. Skip if specifically marked as verification
          if (type === "card_verification") continue;

          // 2. Skip if description contains "verification"
          if (
            description.includes("verification") ||
            description.includes("verify")
          )
            continue;

          // 3. Skip if amount is less than €0.10 (Viva verification is usually €0.01 or €0.00)
          // Adjust this threshold if you sell items for €0.05
          if (amountEur < 0.1) continue;

          // ---------------------------------------------------------

          // Check for successful payment (statusId: "F" = Finished/Success)
          if (tx.statusId === "F") {
            const invoice = {
              id: transactionId,
              date: tx.insDate,
              amount: amountEur.toFixed(2),
              currency: "EUR",
              status: "paid",
              description: tx.customerTrns || tx.merchantTrns || "Payment",
              transactionType: type,
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

      return invoices;
    } catch (error) {
      console.error(`❌ Error fetching invoices for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get transaction type from merchant reference
   * ✅ Added 'card_verification' detection
   */
  getTransactionType(merchantTrns) {
    if (!merchantTrns) return "payment";

    if (merchantTrns.startsWith("CARD_VERIFY_")) return "card_verification"; // 👈 Added this
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
      case 3:
        return "MasterCard"; // Added common code
      case 4:
        return "Amex"; // Added common code
      default:
        return "Card";
    }
  }

  /**
   * Generate invoice/receipt URL for Viva Wallet transaction
   */
  getInvoiceUrl(transactionId, orderCode) {
    const baseUrl = vivaConfig.checkoutURL || "https://demo.vivapayments.com";
    if (orderCode) {
      return `${baseUrl}/web/checkout/receipt?t=${orderCode}`;
    }
    if (transactionId) {
      return `${baseUrl}/transactions?transactionId=${transactionId}`;
    }
    return `${baseUrl}/transactions`;
  }

  /**
   * ✅ Get a single invoice/transaction by ID
   */
  async getInvoiceById(userId, transactionId) {
    try {
      const client = await vivaConfig.createAuthenticatedClient();
      const response = await client.get(
        `/checkout/v2/transactions/${transactionId}`
      );
      const tx = response.data;

      // Verify this transaction belongs to the user
      const user = await this.User.findById(userId).select(
        "vivaWalletCustomerId email vivaWalletPaymentSources firstName lastName"
      );

      if (!user) throw new Error("User not found");

      const belongsToUser =
        user.vivaWalletPaymentSources?.some(
          (ps) => ps.transactionId === transactionId
        ) ||
        (tx.email && tx.email.toLowerCase() === user.email.toLowerCase()) ||
        (tx.merchantTrns && tx.merchantTrns.includes(userId));

      if (!belongsToUser) {
        throw new Error("Invoice not found or does not belong to user");
      }

      return {
        id: transactionId,
        date: tx.insDate,
        amount: (tx.amount).toFixed(2),
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
   * ✅ Updated to respect the filtering in listInvoices
   */
  async getInvoiceStats(userId) {
    try {
      // Reuse listInvoices so statistics match the list (filtering out verifications)
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
