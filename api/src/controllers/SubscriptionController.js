// src/controllers/SubscriptionController.js

const { successResponse, errorResponse } = require("../utils/responseHandler");

class SubscriptionController {
  constructor({ vivaWalletSubscriptionService }) {
    this.subscriptionService = vivaWalletSubscriptionService;
  }

  async getPlans(req, res) {
    try {
      const plans = await this.subscriptionService.getAllPlans();
      successResponse(res, plans, "Subscription plans fetched successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to fetch subscription plans");
    }
  }

  async getSubscriptionStatus(req, res) {
    try {
      const statusDetails =
        await this.subscriptionService.getSubscriptionStatus(req.user.id);
      successResponse(
        res,
        statusDetails,
        "Subscription status fetched successfully."
      );
    } catch (error) {
      const defaultStatus = {
        hasActiveSubscription: false,
        canCreatePackages: false,
        reason: "Could not verify subscription status.",
        status: "INACTIVE",
      };
      errorResponse(
        res,
        defaultStatus,
        error.message || "Failed to fetch subscription status."
      );
    }
  }

  async createTrialSubscription(req, res) {
    try {
      const userId = req.user.id;
      const { planId, paymentMethodId, billingInterval = "month" } = req.body;

      const trialSubscription =
        await this.subscriptionService.createTrialSubscription({
          userId,
          planId,
          paymentMethodId,
          billingInterval,
        });

      successResponse(
        res,
        trialSubscription,
        "Free trial started successfully.",
        201
      );
    } catch (error) {
      errorResponse(res, error, error.message || "Failed to start free trial.");
    }
  }

  async endTrial(req, res) {
    try {
      const result = await this.subscriptionService.endTrialEarly(req.user.id);
      successResponse(res, result, result.message);
    } catch (error) {
      errorResponse(
        res,
        error,
        error.message || "Failed to activate your subscription."
      );
    }
  }

  async createSubscription(req, res) {
    try {
      const userId = req.user.id;
      const { planId, billingInterval = "month" } = req.body;

      const subscription = await this.subscriptionService.createSubscription({
        userId,
        planId,
        billingInterval,
      });

      successResponse(
        res,
        subscription,
        "Subscription created successfully.",
        201
      );
    } catch (error) {
      errorResponse(
        res,
        error,
        error.message || "Failed to create subscription"
      );
    }
  }

  async getSubscription(req, res) {
    try {
      const subscriptionDetails =
        await this.subscriptionService.getSubscription(req.user.id);
      successResponse(
        res,
        subscriptionDetails,
        "Subscription details fetched successfully."
      );
    } catch (error) {
      errorResponse(
        res,
        error,
        error.message || "Failed to fetch subscription details."
      );
    }
  }

  async cancelSubscription(req, res) {
    try {
      const result = await this.subscriptionService.cancelSubscription(
        req.user.id
      );
      successResponse(res, result, result.message);
    } catch (error) {
      errorResponse(res, error, "Failed to cancel subscription.");
    }
  }

  async reactivateSubscription(req, res) {
    try {
      const result = await this.subscriptionService.reactivateSubscription(
        req.user.id
      );
      successResponse(res, result, result.message);
    } catch (error) {
      errorResponse(res, error, "Failed to reactivate subscription.");
    }
  }

  async listInvoices(req, res) {
    try {
      const invoices = await this.subscriptionService.listInvoices(req.user.id);
      successResponse(res, invoices, "Invoices fetched successfully.");
    } catch (error) {
      errorResponse(res, error, "Failed to fetch invoices.");
    }
  }

  /**
   * Get detailed invoice information
   */
  async getInvoiceDetail(req, res) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user.id;

      const invoiceDetail = await this.subscriptionService.getInvoiceDetail(
        userId,
        invoiceId
      );

      successResponse(
        res,
        invoiceDetail,
        "Invoice details fetched successfully."
      );
    } catch (error) {
      if (
        error.message.includes("not found") ||
        error.message.includes("does not belong")
      ) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      errorResponse(res, error, "Failed to fetch invoice details.");
    }
  }
}

module.exports = SubscriptionController;
