const express = require("express");
const authenticateUser = require("../middlewares/authenticate");
const validate = require("../middlewares/validate");
const { 
    paymentMethodIdBodyValidation, 
    paymentMethodIdParamValidation 
} = require("../validations/SubscriptionValidations");

module.exports = (container) => {
  const router = express.Router();
  const paymentMethodController = container.resolve("paymentMethodController");

  // All payment method routes require an authenticated user.
  router.use(authenticateUser);

  // GET /api/payment-methods - List all saved payment methods
  router.get("/", paymentMethodController.list.bind(paymentMethodController));

  // POST /api/payment-methods/attach - Attach a new payment method
  router.post(
    "/attach",
    paymentMethodIdBodyValidation,
    validate,
    paymentMethodController.attach.bind(paymentMethodController)
  );
  
  // PATCH /api/payment-methods/set-default - Set a method as default
  router.patch(
    "/set-default",
    paymentMethodIdBodyValidation,
    validate,
    paymentMethodController.setDefault.bind(paymentMethodController)
  );

  // DELETE /api/payment-methods/:paymentMethodId - Detach a payment method
  router.delete(
    "/:paymentMethodId",
    paymentMethodIdParamValidation,
    validate,
    paymentMethodController.detach.bind(paymentMethodController)
  );

  return router;
};