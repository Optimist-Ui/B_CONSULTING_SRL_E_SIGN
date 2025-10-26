const { successResponse, errorResponse } = require("../utils/responseHandler");

class SubscriptionController {
  constructor({ subscriptionService }) {
    this.subscriptionService = subscriptionService;
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
      // Send a default "inactive" status on any error for security
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
      const { priceId, paymentMethodId } = req.body;

      const trialSubscription =
        await this.subscriptionService.createTrialSubscription({
          userId,
          priceId,
          paymentMethodId,
        });

      successResponse(
        res,
        trialSubscription,
        "Free trial started successfully.",
        201
      );
    } catch (error) {
      // Provide a clear error message to the frontend
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
      const userId = req.user.id; // From authenticate middleware
      const { priceId, paymentMethodId } = req.body;

      const subscription = await this.subscriptionService.createSubscription({
        userId,
        priceId,
        paymentMethodId,
      });

      successResponse(
        res,
        subscription,
        "Subscription created successfully.",
        201
      );
    } catch (error) {
      // Pass the original error message to the frontend for better debugging
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
}

module.exports = SubscriptionController;
