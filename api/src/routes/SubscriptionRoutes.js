const express = require("express");
const {
  createSubscriptionValidation,
} = require("../validations/SubscriptionValidations");
const authenticateUser = require("../middlewares/authenticate");
const validate = require("../middlewares/validate");

module.exports = (container) => {
  const router = express.Router();
  const subscriptionController = container.resolve("subscriptionController");

  // Public route to view plans
  router.get("/", subscriptionController.getPlans.bind(subscriptionController));

  // --- All routes below require a logged-in user ---
  router.use(authenticateUser);
  router.get(
    "/status",
    subscriptionController.getSubscriptionStatus.bind(subscriptionController)
  );
  router.post(
    "/create-trial",
    createSubscriptionValidation, // Can reuse the same validation
    validate,
    subscriptionController.createTrialSubscription.bind(subscriptionController)
  );
  router.post(
    "/create",
    createSubscriptionValidation,
    validate,
    subscriptionController.createSubscription.bind(subscriptionController)
  );

  // ✅ GET current subscription details
  router.get(
    "/my-subscription",
    subscriptionController.getSubscription.bind(subscriptionController)
  );
  router.patch(
    "/end-trial",
    subscriptionController.endTrial.bind(subscriptionController)
  );
  // ✅ PATCH to cancel the subscription
  router.patch(
    "/cancel",
    subscriptionController.cancelSubscription.bind(subscriptionController)
  );

  // ✅ PATCH to reactivate a cancelled subscription
  router.patch(
    "/reactivate",
    subscriptionController.reactivateSubscription.bind(subscriptionController)
  );

  // ✅ GET list of invoices
  router.get(
    "/invoices",
    subscriptionController.listInvoices.bind(subscriptionController)
  );

  return router;
};
