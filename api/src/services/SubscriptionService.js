class SubscriptionService {
  constructor({
    Plan,
    User,
    stripe,
    UsedTrialFingerprintModel,
    emailService,
    planService,
    userService,
  }) {
    this.Plan = Plan;
    this.User = User;
    this.UsedTrialFingerprint = UsedTrialFingerprintModel;
    this.stripe = stripe;
    this.emailService = emailService;
    this.planService = planService;
    this.userService = userService;
  }

  /**
   * Fetches all available subscription plans from the database.
   */
  async getAllPlans() {
    const plans = await this.Plan.find({}).sort({ monthlyPrice: 1 }); // Sort by price, ascending
    if (!plans) {
      throw new Error("No subscription plans found.");
    }
    return plans;
  }

  /**
   * Checks the user's current subscription and returns a simple access status for the UI.
   * This is a lightweight alternative to getSubscription for UI permission checks.
   */
  /**
   * Enhanced getSubscription to include trial information
   * @param {string} userId - The user ID
   */
  async getSubscription(userId) {
    try {
      const user = await this.userService.findUserById(userId);
      if (!user || !user.subscription || !user.subscription.subscriptionId) {
        throw new Error("No subscription found.");
      }

      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        user.subscription.subscriptionId,
        { expand: ["plan.product"] }
      );

      let renewsAtDate = null;
      let startDate = null;
      let trialEndDate = null;

      // Determine the RENEWAL date (period end)
      if (
        stripeSubscription.current_period_end &&
        typeof stripeSubscription.current_period_end === "number"
      ) {
        renewsAtDate = new Date(stripeSubscription.current_period_end * 1000);
      } else if (user.subscription.current_period_end) {
        const dbDate = new Date(user.subscription.current_period_end);
        if (!isNaN(dbDate.getTime())) {
          renewsAtDate = dbDate;
        }
      }

      // Determine the START date (period start)
      if (
        stripeSubscription.current_period_start &&
        typeof stripeSubscription.current_period_start === "number"
      ) {
        startDate = new Date(stripeSubscription.current_period_start * 1000);
      } else if (user.subscription.current_period_start) {
        const dbDate = new Date(user.subscription.current_period_start);
        if (!isNaN(dbDate.getTime())) {
          startDate = dbDate;
        }
      }

      // Determine trial end date (if in trial)
      if (stripeSubscription.status === "trialing") {
        if (
          stripeSubscription.trial_end &&
          typeof stripeSubscription.trial_end === "number"
        ) {
          trialEndDate = new Date(stripeSubscription.trial_end * 1000);
        } else if (user.subscription.trial_end) {
          const dbDate = new Date(user.subscription.trial_end);
          if (!isNaN(dbDate.getTime())) {
            trialEndDate = dbDate;
          }
        }
      }

      const planDetails = stripeSubscription.plan;
      const planPrice =
        planDetails && planDetails.amount
          ? (planDetails.amount / 100).toFixed(2)
          : "0.00";
      const planInterval = planDetails ? planDetails.interval : "N/A";

      const isTrialing = stripeSubscription.status === "trialing";
      const plan = await this.planService.findPlanById(
        user.subscription.planId
      );
      const documentLimit = isTrialing ? 3 : plan?.documentLimit || 0;

      const result = {
        planName: user.subscription.planName,
        documentLimit: documentLimit, // Use the dynamically set limit
        documentsUsed: user.documentsCreatedThisMonth || 0,
        status: stripeSubscription.status,
        renewsAt: renewsAtDate ? renewsAtDate.toISOString() : null,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        planPrice: planPrice,
        planInterval: planInterval,
        startDate: startDate ? startDate.toISOString() : null,
      };

      if (isTrialing) {
        result.trialEndDate = trialEndDate ? trialEndDate.toISOString() : null;
        result.isTrialing = true;
      } else {
        result.isTrialing = false;
      }

      return result;
    } catch (error) {
      throw new Error(error.message || "Failed to fetch subscription details.");
    }
  }
  // Updated createTrialSubscription method in SubscriptionService.js
  async createTrialSubscription({ userId, priceId, paymentMethodId }) {
    try {
      // 1. Fetch user and plan, same as regular subscription
      const user = await this.userService.findUserById(userId);
      if (!user) throw new Error("User not found");

      const plan = await this.planService.findPlanByPriceId(priceId);
      if (!plan) throw new Error("Plan not found");

      // --- TRIAL ABUSE PREVENTION ---
      if (user.hasHadTrial) {
        throw new Error("This account has already used a free trial.");
      }

      const paymentMethod = await this.stripe.paymentMethods.retrieve(
        paymentMethodId
      );
      if (!paymentMethod.card || !paymentMethod.card.fingerprint) {
        throw new Error("Invalid payment method details provided.");
      }

      const fingerprint = paymentMethod.card.fingerprint;
      const existingFingerprint = await this.UsedTrialFingerprint.findOne({
        fingerprint,
      });

      if (existingFingerprint) {
        throw new Error(
          "This payment method has already been used for a free trial."
        );
      }
      // --- END OF TRIAL ABUSE PREVENTION ---

      // 3. Create Stripe customer if they don't exist
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: { userId: userId.toString() },
        });
        stripeCustomerId = customer.id;
        await this.userService.updateUser(userId, { stripeCustomerId });
      }

      // 4. Attach and set as default payment method
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });
      await this.stripe.customers.update(stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      // 5. Create the subscription in Stripe WITH the trial period
      const subscription = await this.stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        trial_period_days: 14,
        default_payment_method: paymentMethodId,
      });

      // 🔧 FIXED: Proper date handling for trial subscriptions
      const subscriptionData = {
        subscription: {
          subscriptionId: subscription.id,
          planId: plan._id,
          planName: plan.name,
          status: subscription.status, // 'trialing'
          // For trial subscriptions, use trial_start as the period start
          current_period_start: subscription.trial_start
            ? new Date(subscription.trial_start * 1000)
            : new Date(), // Fallback to now if trial_start is missing
          // For trial subscriptions, the "current period end" should be the trial end date
          current_period_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Fallback: 14 days from now
          // Store the actual trial end date
          trial_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        hasHadTrial: true,
      };

      console.log("Trial subscription data being saved:", {
        current_period_start:
          subscriptionData.subscription.current_period_start,
        current_period_end: subscriptionData.subscription.current_period_end,
        trial_end: subscriptionData.subscription.trial_end,
      });

      await this.userService.updateUser(userId, subscriptionData);

      // 7. Save the card fingerprint to prevent reuse
      await this.UsedTrialFingerprint.create({ fingerprint, usedBy: userId });

      // 8. Send trial activation email
      try {
        const trialEndDate =
          subscriptionData.subscription.trial_end.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

        await this.emailService.sendTrialActivationEmail(
          user.email,
          user.firstName,
          plan.name,
          trialEndDate,
          3
        );
      } catch (emailError) {
        console.error(
          `[Non-blocking] Failed to send trial activation email for user ${userId}:`,
          emailError
        );
      }

      return {
        id: subscription.id,
        status: subscription.status,
        trial_end: subscriptionData.subscription.trial_end,
        billing_cycle_start: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null, // This is when actual billing starts (after trial)
      };
    } catch (error) {
      console.error("Error creating trial subscription:", error);
      throw error;
    }
  }

  // In class SubscriptionService

  /**
   * Ends a user's trial period immediately, converting them to a paid subscriber.
   * @param {string} userId - The ID of the user ending their trial.
   */
  async endTrialEarly(userId) {
    // 1. Find the user and their subscription details
    const user = await this.userService.findUserById(userId);
    if (!user || !user.subscription || !user.subscription.subscriptionId) {
      throw new Error("No active trial found to end.");
    }

    const { status, subscriptionId, planName } = user.subscription;

    // 2. Security Check: Ensure the subscription is actually in a trial period.
    if (status !== "trialing") {
      throw new Error("Your subscription is not in a trial period.");
    }

    // 3. Call Stripe to update the subscription
    try {
      const updatedSubscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          trial_end: "now", // End the trial immediately
          // --- FIX: Expand the response to include the newly generated invoice ---
          expand: ["latest_invoice"],
        }
      );

      // --- FIX: Manually trigger the subscription confirmation email ---
      // This is the most reliable way to ensure the email is sent for this specific action.
      const invoice = updatedSubscription.latest_invoice;

      // Ensure the invoice was created and successfully paid before sending an email
      if (invoice && invoice.status === "paid") {
        const amount = (invoice.amount_paid / 100).toFixed(2);
        const renewalDate = new Date(
          updatedSubscription.current_period_end * 1000
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const invoiceUrl = invoice.hosted_invoice_url;

        // Use a non-blocking try/catch so that if the email fails,
        // the user's activation process still succeeds.
        try {
          await this.emailService.sendSubscriptionConfirmation(
            user.email,
            user.firstName,
            planName,
            amount,
            renewalDate,
            invoiceUrl
          );
          console.log(
            `Successfully sent end-trial confirmation email to user ${userId}.`
          );
        } catch (emailError) {
          console.error(
            `[Non-blocking] Failed to send end-trial confirmation email for user ${userId}:`,
            emailError
          );
        }
      }
      // --- END OF FIX ---

      return {
        message:
          "Your trial has been successfully ended. Your paid subscription is now active.",
        status: "active", // We can optimistically return 'active'
      };
    } catch (error) {
      console.error(`Stripe error ending trial for user ${userId}:`, error);
      // Pass a more user-friendly error message
      throw new Error(
        "Could not activate your subscription at this time. Please check your payment method or contact support."
      );
    }
  }

  /**
   * Checks the user's current subscription and returns a simple access status for the UI.
   * This is a lightweight alternative to getSubscription for UI permission checks.
   */
  async getSubscriptionStatus(userId) {
    try {
      const user = await this.userService.findUserById(userId);
      if (!user) {
        return {
          hasActiveSubscription: false,
          canCreatePackages: false,
          reason: "User not found.",
          status: "INACTIVE",
        };
      }

      // Case 1: No subscription at all
      if (!user.subscription || !user.subscription.planId) {
        return {
          hasActiveSubscription: false,
          canCreatePackages: false,
          reason: "No subscription found.",
          status: "INACTIVE",
        };
      }

      const { status, planId } = user.subscription;

      // Get plan details
      const plan = await this.planService.findPlanById(planId);
      if (!plan) {
        return {
          hasActiveSubscription: false,
          canCreatePackages: false,
          reason: "Plan not found.",
          status: "INACTIVE",
        };
      }

      // Case 2: Subscription exists but is not active or trialing
      if (!["active", "trialing"].includes(status)) {
        return {
          hasActiveSubscription: false,
          canCreatePackages: false,
          reason: `Your subscription is currently ${status}. An active plan is required.`,
          status: "INACTIVE",
        };
      }

      // Case 3: Check document limit
      const isTrialing = status === "trialing";
      const documentLimit = isTrialing ? 3 : plan.documentLimit;
      const documentsUsed = user.documentsCreatedThisMonth || 0;

      if (documentLimit !== -1 && documentsUsed >= documentLimit) {
        return {
          hasActiveSubscription: true,
          canCreatePackages: false,
          reason: "You have reached your monthly document limit.",
          status: "LIMIT_REACHED",
          documentsUsed,
          documentLimit,
        };
      }

      // Case 4: Everything is good
      return {
        hasActiveSubscription: true,
        canCreatePackages: true,
        reason: "Subscription is active.",
        status: "ACTIVE",
        documentsUsed,
        documentLimit,
      };
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      // Return safe default on error
      return {
        hasActiveSubscription: false,
        canCreatePackages: false,
        reason: "Could not verify subscription status.",
        status: "INACTIVE",
      };
    }
  }
  async createSubscription({ userId, priceId, paymentMethodId }) {
    try {
      // 1. Get the user from database
      const user = await this.userService.findUserById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // 2. Get the plan details from your database
      const plan = await this.planService.findPlanByPriceId(priceId);
      if (!plan) {
        throw new Error("Plan not found");
      }

      // 3. Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: { userId: userId.toString() },
        });
        stripeCustomerId = customer.id;

        // Update user with Stripe customer ID
        await this.userService.updateUser(userId, {
          stripeCustomerId: stripeCustomerId,
        });
      }

      // 4. Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });

      // 5. Set as default payment method
      await this.stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      const subscription = await this.stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        default_payment_method: paymentMethodId,
        expand: ["latest_invoice"],
      });

      // --- 👇 FINAL, EVIDENCE-BASED LOGIC STARTS HERE 👇 ---
      let periodStart, periodEnd;

      // PRIORITY 1: The invoice's first line item period is the most reliable source on creation.
      // We use optional chaining (?.) for safety, in case this structure ever changes.
      const lineItemPeriod =
        subscription.latest_invoice?.lines?.data?.[0]?.period;

      if (lineItemPeriod) {
        if (lineItemPeriod.start) {
          periodStart = new Date(lineItemPeriod.start * 1000);
        }
        if (lineItemPeriod.end) {
          periodEnd = new Date(lineItemPeriod.end * 1000);
        }
        console.log(`[Line Item Logic] Determined subscription period.`);
      }

      // PRIORITY 2: Fallback to the main subscription object's period.
      if (!periodStart && subscription.current_period_start) {
        periodStart = new Date(subscription.current_period_start * 1000);
        console.log(`[Subscription Logic Fallback] Determined start date.`);
      }
      if (!periodEnd && subscription.current_period_end) {
        periodEnd = new Date(subscription.current_period_end * 1000);
        console.log(`[Subscription Logic Fallback] Determined end date.`);
      }

      console.log(`Final determined subscription start date: ${periodStart}`);
      console.log(`Final determined subscription end date: ${periodEnd}`);

      const subscriptionData = {
        subscription: {
          subscriptionId: subscription.id,
          planId: plan._id,
          planName: plan.name,
          status: subscription.status,
          current_period_start: periodStart,
          current_period_end: periodEnd,
        },
      };

      // --- END OF FINAL LOGIC ---

      if (subscription.status === "trialing" && !user.hasHadTrial) {
        subscriptionData.hasHadTrial = true;
      }

      await this.userService.updateUser(userId, subscriptionData);

      return {
        id: subscription.id,
        status: subscription.status,
        latest_invoice: subscription.latest_invoice,
      };
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  }

  /**
   * Fetches a list of all invoices for a given user from Stripe.
   */
  async listInvoices(userId) {
    const user = await this.User.findById(userId).select("stripeCustomerId");
    if (!user || !user.stripeCustomerId) {
      // A user with no customer ID can't have any invoices.
      return [];
    }

    const invoices = await this.stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 24, // Get the last 2 years of monthly invoices
    });

    // Sanitize the response to send only what the frontend needs
    return invoices.data.map((invoice) => ({
      id: invoice.id,
      createdAt: new Date(invoice.created * 1000),
      amount: (invoice.total / 100).toFixed(2), // Convert from cents
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      // This is the direct link to the Stripe-hosted invoice page
      downloadUrl: invoice.hosted_invoice_url,
    }));
  }

  /**
   * Cancels a user's subscription at the end of the current billing period.
   */
  async cancelSubscription(userId) {
    const user = await this.User.findById(userId).select(
      "subscription email firstName"
    );
    if (!user || !user.subscription || !user.subscription.subscriptionId) {
      throw new Error("No active subscription to cancel.");
    }

    const updatedSubscription = await this.stripe.subscriptions.update(
      user.subscription.subscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // --- 👇 TRIGGER CANCELLATION EMAIL 👇 ---
    try {
      const expiryDate = new Date(
        updatedSubscription.current_period_end * 1000
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await this.emailService.sendCancellationConfirmation(
        user.email,
        user.firstName,
        user.subscription.planName,
        expiryDate
      );
    } catch (emailError) {
      // Non-blocking error: the main operation succeeded, so we just log the email failure.
      console.error(
        `[Non-blocking] Failed to send cancellation email for user ${userId}:`,
        emailError
      );
    }
    // --- END OF EMAIL TRIGGER ---

    return {
      message:
        "Your subscription has been cancelled and will remain active until your current billing period ends.",
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      renewsAt: new Date(updatedSubscription.current_period_end * 1000),
    };
  }

  /**
   * Reactivates a subscription that was previously set to be cancelled.
   */
  async reactivateSubscription(userId) {
    const user = await this.User.findById(userId).select(
      "subscription email firstName"
    );
    if (!user || !user.subscription || !user.subscription.subscriptionId) {
      throw new Error("No subscription found to reactivate.");
    }

    const updatedSubscription = await this.stripe.subscriptions.update(
      user.subscription.subscriptionId,
      {
        cancel_at_period_end: false,
      }
    );

    // --- 👇 TRIGGER REACTIVATION EMAIL 👇 ---
    try {
      const renewalDate = new Date(
        updatedSubscription.current_period_end * 1000
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await this.emailService.sendReactivationConfirmation(
        user.email,
        user.firstName,
        user.subscription.planName,
        renewalDate
      );
    } catch (emailError) {
      console.error(
        `[Non-blocking] Failed to send reactivation email for user ${userId}:`,
        emailError
      );
    }
    // --- END OF EMAIL TRIGGER ---

    return {
      message:
        "Your subscription has been reactivated and will now auto-renew.",
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      renewsAt: new Date(updatedSubscription.current_period_end * 1000),
    };
  }

  /**
   * Enhanced handleSubscriptionUpdate to properly handle trial end dates
   * @param {string} subscriptionId - The Stripe subscription ID
   */
  async handleSubscriptionUpdate(subscriptionId) {
    try {
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        subscriptionId
      );

      const user = await this.userService.findUserByStripeCustomerId(
        stripeSubscription.customer
      );
      if (!user) {
        console.error(
          `User not found for Stripe customer: ${stripeSubscription.customer}`
        );
        return;
      }

      const updateData = {
        "subscription.status": stripeSubscription.status,
      };

      // 🔧 FIXED: Only update dates if they're valid
      if (
        stripeSubscription.current_period_start &&
        !isNaN(stripeSubscription.current_period_start)
      ) {
        updateData["subscription.current_period_start"] = new Date(
          stripeSubscription.current_period_start * 1000
        );
      }

      if (
        stripeSubscription.current_period_end &&
        !isNaN(stripeSubscription.current_period_end)
      ) {
        updateData["subscription.current_period_end"] = new Date(
          stripeSubscription.current_period_end * 1000
        );
      }

      // Handle trial end date with validation
      if (
        stripeSubscription.trial_end &&
        !isNaN(stripeSubscription.trial_end)
      ) {
        updateData["subscription.trial_end"] = new Date(
          stripeSubscription.trial_end * 1000
        );
      } else if (stripeSubscription.status !== "trialing") {
        // Only remove trial_end if no longer trialing AND trial_end is invalid
        updateData["subscription.trial_end"] = null;
      }

      console.log(
        `Updating subscription for user ${user._id} with data:`,
        updateData
      );
      await this.userService.updateUser(user._id, updateData);

      console.log(`Updated subscription for user ${user._id}`);
    } catch (error) {
      console.error("Error handling subscription update:", error);
    }
  }

  /**
   * Handles subscription cancellations that come from outside our app (e.g., from the Stripe dashboard).
   */
  async handleSubscriptionDeleted(subscriptionId) {
    try {
      // Find user with this subscription
      const user = await this.userService.findUserBySubscriptionId(
        subscriptionId
      );
      if (!user) {
        console.error(`User not found for subscription: ${subscriptionId}`);
        return;
      }

      // Clear subscription data
      await this.userService.updateUser(user._id, {
        subscription: undefined,
      });

      console.log(`Cleared subscription for user ${user._id}`);
    } catch (error) {
      console.error("Error handling subscription deletion:", error);
    }
  }

  /**
   * Enhanced processSubscriptionConfirmationEmail to handle trial transitions
   * @param {object} invoice - The full invoice object from the Stripe webhook.
   */
  async processSubscriptionConfirmationEmail(invoice) {
    try {
      // 1. Find the user in your database using the customer ID from the invoice
      const user = await this.userService.findUserByStripeCustomerId(
        invoice.customer
      );
      if (!user) {
        console.error(
          `Could not send confirmation email: User not found for Stripe customer ID ${invoice.customer}`
        );
        return;
      }

      // We can rely on our database now having the correct plan name from the createSubscription call
      if (!user.subscription || !user.subscription.planName) {
        console.error(
          `Could not send confirmation email: User ${user._id} has an invoice but no subscription plan name in DB.`
        );
        return;
      }

      // 2. Check if this is a trial-to-active transition
      const isTrialToActive =
        invoice.billing_reason === "subscription_cycle" &&
        user.subscription.status === "trialing";

      // 3. Gather all the necessary data for the email
      const planName = user.subscription.planName;
      const amount = (invoice.amount_paid / 100).toFixed(2);

      // Get the renewal date from the invoice line item's period end
      const renewalDateTimestamp = invoice.lines.data[0]?.period?.end;
      const renewalDate = renewalDateTimestamp
        ? new Date(renewalDateTimestamp * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "N/A"; // Fallback

      const invoiceUrl = invoice.hosted_invoice_url;

      // 4. Send appropriate email based on invoice type
      if (isTrialToActive) {
        // Send trial-to-active transition email
        const firstBillingDate = new Date(
          invoice.created * 1000
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        await this.emailService.sendTrialToActiveTransitionEmail(
          user.email,
          user.firstName,
          planName,
          firstBillingDate,
          renewalDate,
          amount,
          invoiceUrl
        );
      } else if (invoice.billing_reason === "subscription_create") {
        // Send regular subscription confirmation (only for new non-trial subscriptions)
        await this.emailService.sendSubscriptionConfirmation(
          user.email,
          user.firstName,
          planName,
          amount,
          renewalDate,
          invoiceUrl
        );
      }
      // For regular renewal invoices (billing_reason === "subscription_cycle" but not from trial),
      // you might want to send a different email or no email at all
    } catch (error) {
      console.error("Error processing subscription confirmation email:", error);
    }
  }
}

module.exports = SubscriptionService;
