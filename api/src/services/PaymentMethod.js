class PaymentMethod {
  constructor({ Plan, User, stripe, emailService, planService, userService }) {
    this.Plan = Plan;
    this.User = User;
    this.stripe = stripe;
    this.emailService = emailService;
    this.planService = planService;
    this.userService = userService;
  }
  // --- 헬 READ: List a user's saved payment methods ---
  async listPaymentMethods(userId) {
    const user = await this.User.findById(userId).select(
      "stripeCustomerId subscription"
    );
    if (!user || !user.stripeCustomerId) {
      // If the user has no Stripe customer ID, they have no saved methods.
      return [];
    }

    // 1. Fetch all of the user's cards from Stripe
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: "card",
    });

    // 2. Determine the correct default payment method ID
    let defaultPaymentMethodId = null;
    const subscriptionId = user.subscription?.subscriptionId;
    const subscriptionStatus = user.subscription?.status;

    // If there's an active subscription, it is the source of truth for the default PM
    if (
      subscriptionId &&
      ["active", "trialing", "past_due"].includes(subscriptionStatus)
    ) {
      const subscription = await this.stripe.subscriptions.retrieve(
        subscriptionId
      );
      defaultPaymentMethodId = subscription.default_payment_method;
    } else {
      // If there's NO active subscription, the customer object is the source of truth
      const customer = await this.stripe.customers.retrieve(
        user.stripeCustomerId
      );
      defaultPaymentMethodId = customer.invoice_settings.default_payment_method;
    }

    // 3. Map the card list and use our determined default ID to set the flag
    return paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      exp_month: pm.card.exp_month,
      exp_year: pm.card.exp_year,
      // Now it checks against the correct source of truth
      isDefault: pm.id === defaultPaymentMethodId,
    }));
  }

  // ---  CREATE: Attach a new payment method to a customer ---
  async attachPaymentMethod({ userId, paymentMethodId }) {
    // ✅ We now fetch the full user object to get their name and email if needed
    const user = await this.User.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    let customerId = user.stripeCustomerId;

    // ✅ The "Create-if-not-exist" logic block
    if (!customerId) {
      console.log(
        `Stripe customer not found for user ${userId}. Creating a new one.`
      );
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        // We can attach the payment method during customer creation
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      customerId = customer.id;

      // IMPORTANT: Save the new customer ID to your database
      user.stripeCustomerId = customerId;
      await user.save();

      // Since we attached it during creation, the work is done.
      return { message: "Payment method added successfully." };
    }

    // If the customer already exists, just attach the new method
    // This part of the logic runs for existing customers adding a second card, etc.
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Optional but good UX: Set the newly added card as the default if it's their first one.
    const customer = await this.stripe.customers.retrieve(customerId);
    if (!customer.invoice_settings.default_payment_method) {
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    return { message: "Payment method added successfully." };
  }

  // --- UPDATE: Set a default payment method for subscriptions ---
  async setDefaultPaymentMethod({ userId, paymentMethodId }) {
    // 1. Fetch the user with their necessary IDs
    const user = await this.User.findById(userId).select(
      "stripeCustomerId subscription"
    );
    if (!user || !user.stripeCustomerId) {
      throw new Error("Stripe customer not found for this user.");
    }

    // 2. ✅ Always update the default payment method on the Customer object.
    // This allows non-subscribed users to set their preferred card for future use.
    await this.stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // 3. ✅ Conditionally update the Subscription object *only if* it exists and is active.
    const subscriptionId = user.subscription?.subscriptionId;
    const subscriptionStatus = user.subscription?.status;

    if (
      subscriptionId &&
      ["active", "trialing", "past_due"].includes(subscriptionStatus)
    ) {
      // This block will be safely skipped for users without a subscription.
      try {
        await this.stripe.subscriptions.update(subscriptionId, {
          default_payment_method: paymentMethodId,
        });
      } catch (error) {
        // This is a safety net in case the subscription was cancelled on Stripe but not in our DB yet.
        // We can log it, but the primary goal (updating the customer) still succeeded.
        console.error(
          `Failed to update Stripe subscription ${subscriptionId} for user ${userId}, but customer was updated. Error: ${error.message}`
        );
      }
    }

    return { message: "Default payment method updated successfully." };
  }

  // --- DELETE: Detach a payment method from a customer ---
  async deletePaymentMethod({ userId, paymentMethodId }) {
    const user = await this.User.findById(userId).select(
      "stripeCustomerId subscription"
    );
    if (!user || !user.stripeCustomerId) {
      throw new Error("Stripe customer not found for this user.");
    }

    // --- Critical Business Logic ---
    // Prevent user from deleting the payment method tied to an active subscription.
    if (user.subscription && user.subscription.subscriptionId) {
      const subscription = await this.stripe.subscriptions.retrieve(
        user.subscription.subscriptionId
      );
      if (
        subscription.default_payment_method === paymentMethodId &&
        ["active", "trialing", "past_due"].includes(subscription.status)
      ) {
        throw new Error(
          "Cannot delete the default payment method of an active subscription. Please set a new default first."
        );
      }
    }

    // If the check passes, detach the payment method
    await this.stripe.paymentMethods.detach(paymentMethodId);

    return { message: "Payment method removed successfully." };
  }
}

module.exports = PaymentMethod;
