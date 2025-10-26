const { successResponse, errorResponse } = require("../utils/responseHandler");

class PaymentMethodController {

  constructor({ paymentMethod }) {
    // We reuse the subscription service as it contains all Stripe logic
    this.PaymentMethod = paymentMethod;
  }

  async list(req, res) {
    try {
      const paymentMethods = await this.PaymentMethod.listPaymentMethods(req.user.id);
      successResponse(res, paymentMethods, "Payment methods fetched successfully.");
    } catch (error) {
      errorResponse(res, error, "Failed to fetch payment methods.");
    }
  }

  async attach(req, res) {
    try {
      const { paymentMethodId } = req.body;
      const result = await this.PaymentMethod.attachPaymentMethod({
        userId: req.user.id,
        paymentMethodId,
      });
      successResponse(res, result, result.message, 201);
    } catch (error) {
      errorResponse(res, error, "Failed to attach payment method.");
    }
  }
  
  async setDefault(req, res) {
    try {
        const { paymentMethodId } = req.body;
        const result = await this.PaymentMethod.setDefaultPaymentMethod({
            userId: req.user.id,
            paymentMethodId,
        });
        successResponse(res, result, result.message);
    } catch (error) {
        errorResponse(res, error, "Failed to set default payment method.");
    }
  }

  async detach(req, res) {
    try {
      const { paymentMethodId } = req.params;
      const result = await this.PaymentMethod.deletePaymentMethod({
        userId: req.user.id,
        paymentMethodId,
      });
      successResponse(res, result, result.message);
    } catch (error)
    {
      errorResponse(res, error, "Failed to remove payment method.");
    }
  }
}

module.exports = PaymentMethodController;