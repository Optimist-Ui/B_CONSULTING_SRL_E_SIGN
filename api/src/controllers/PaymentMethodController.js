// src/controllers/PaymentMethodController.js

const { successResponse, errorResponse } = require("../utils/responseHandler");

class PaymentMethodController {
  constructor({ vivaWalletPaymentService }) {
    this.vivaWalletPaymentService = vivaWalletPaymentService;
  }

  /**
   * List all payment methods for a user
   */
  async list(req, res) {
    try {
      const result = await this.vivaWalletPaymentService.getPaymentSources(
        req.user.id
      );

      const paymentMethods = result.paymentSources.map((source) => ({
        id: source.id,
        cardType: source.cardType,
        last4: source.last4,
        exp_month: source.expiryMonth,
        exp_year: source.expiryYear,
        isDefault: source.isDefault,
      }));

      successResponse(
        res,
        paymentMethods,
        "Payment methods fetched successfully."
      );
    } catch (error) {
      errorResponse(res, error, "Failed to fetch payment methods.");
    }
  }

  /**
   * Create a payment order to add a new payment method
   * Frontend will redirect user to Viva Wallet checkout
   */
  async createOrder(req, res) {
    try {
      const { name, email, returnUrl } = req.body;

      const result = await this.vivaWalletPaymentService.createPaymentOrder(
        req.user.id,
        name,
        email,
        returnUrl
      );

      successResponse(
        res,
        {
          orderCode: result.orderCode,
          checkoutUrl: result.checkoutUrl,
        },
        "Payment order created successfully. Redirect user to checkoutUrl.",
        201
      );
    } catch (error) {
      errorResponse(res, error, "Failed to create payment order.");
    }
  }

  /**
   * Set a payment method as default
   */
  async setDefault(req, res) {
    try {
      const { paymentSourceId } = req.body;

      await this.vivaWalletPaymentService.setDefaultPaymentSource(
        req.user.id,
        paymentSourceId
      );

      successResponse(
        res,
        { defaultPaymentSourceId: paymentSourceId },
        "Default payment method updated successfully."
      );
    } catch (error) {
      errorResponse(res, error, "Failed to set default payment method.");
    }
  }

  /**
   * Delete (detach) a payment method
   */
  async detach(req, res) {
    try {
      const { paymentSourceId } = req.params;

      await this.vivaWalletPaymentService.deletePaymentSource(
        req.user.id,
        paymentSourceId
      );

      successResponse(
        res,
        { success: true },
        "Payment method removed successfully."
      );
    } catch (error) {
      errorResponse(res, error, "Failed to remove payment method.");
    }
  }
}

module.exports = PaymentMethodController;
