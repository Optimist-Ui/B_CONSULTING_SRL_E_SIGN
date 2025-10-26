// src/services/SubscriptionService.js

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
    const plans = await this.Plan.find({}).sort({ monthlyPrice: 1 });
    if (!plans) {
      throw new Error("No subscription plans found.");
    }
    return plans;
  }

  /**
   * FIX APPLIED: Use local DB dates as a fallback if live Stripe dates are null.
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

      const planDetails = stripeSubscription.plan;
      const isTrialing = stripeSubscription.status === "trialing";

      let renewsAt = null;
      if (stripeSubscription.current_period_end) {
        renewsAt = new Date(
          stripeSubscription.current_period_end * 1000
        ).toISOString();
      } else if (user.subscription.current_period_end) {
        renewsAt = new Date(user.subscription.current_period_end).toISOString();
      }

      let startDate = null;
      if (stripeSubscription.current_period_start) {
        startDate = new Date(
          stripeSubscription.current_period_start * 1000
        ).toISOString();
      } else if (user.subscription.current_period_start) {
        startDate = new Date(
          user.subscription.current_period_start
        ).toISOString();
      }

      let trialEndDate = null;
      if (isTrialing) {
        if (stripeSubscription.trial_end) {
          trialEndDate = new Date(
            stripeSubscription.trial_end * 1000
          ).toISOString();
        } else if (user.subscription.trial_end) {
          trialEndDate = new Date(user.subscription.trial_end).toISOString();
        }
      }

      const result = {
        planName: user.subscription.planName,
        documentLimit: user.getTotalDocumentLimit(),
        documentsUsed: user.getTotalDocumentsUsed(),
        status: stripeSubscription.status,
        renewsAt: renewsAt,
        startDate: startDate,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        planPrice: planDetails ? (planDetails.amount / 100).toFixed(2) : "0.00",
        planInterval: planDetails ? planDetails.interval : "N/A",
        isTrialing: isTrialing,
        trialEndDate: trialEndDate,
      };

      return result;
    } catch (error) {
      if (error instanceof RangeError) {
        throw new Error("Failed to parse subscription dates from Stripe.");
      }
      throw new Error(error.message || "Failed to fetch subscription details.");
    }
  }

  /**
   * REWRITTEN: Creates a trial and correctly initializes the subscriptionHistory.
   */
  async createTrialSubscription({ userId, priceId, paymentMethodId }) {
    try {
      const user = await this.userService.findUserById(userId);
      if (!user) throw new Error("User not found");

      const plan = await this.planService.findPlanByPriceId(priceId);
      if (!plan) throw new Error("Plan not found");

      if (user.hasHadTrial) {
        throw new Error("This account has already used a free trial.");
      }

      // --- TRIAL ABUSE PREVENTION ---
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

      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: { userId: userId.toString() },
        });
        stripeCustomerId = customer.id;
      }

      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });
      await this.stripe.customers.update(stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      const subscription = await this.stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        trial_period_days: 14,
        default_payment_method: paymentMethodId,
      });

      const trialStartDate = new Date(subscription.trial_start * 1000);
      const trialEndDate = new Date(subscription.trial_end * 1000);

      // Correctly initialize the subscription history for the trial
      const trialHistory = {
        type: "trial",
        planId: plan._id,
        planName: "Trial",
        startDate: trialStartDate,
        endDate: trialEndDate,
        documentLimit: 3,
        documentsUsed: 0,
        status: "active",
      };

      await this.userService.updateUser(userId, {
        stripeCustomerId,
        subscription: {
          subscriptionId: subscription.id,
          planId: plan._id,
          planName: plan.name,
          status: subscription.status,
          current_period_start: trialStartDate,
          current_period_end: trialEndDate,
          trial_end: trialEndDate,
        },
        hasHadTrial: true,
        subscriptionHistory: [trialHistory],
      });

      await this.UsedTrialFingerprint.create({ fingerprint, usedBy: userId });

      try {
        const formattedTrialEndDate = trialEndDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        await this.emailService.sendTrialActivationEmail(
          user.email,
          user.firstName,
          plan.name,
          formattedTrialEndDate,
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
        trial_end: trialEndDate.toISOString(),
      };
    } catch (error) {
      console.error("Error creating trial subscription:", error);
      throw error;
    }
  }

  /**
   * FIX: Properly calculate end dates based on plan interval (monthly vs yearly)
   */
  async endTrialEarly(userId) {
    const user = await this.userService.findUserById(userId);
    if (
      !user ||
      !user.subscription ||
      !user.subscription.subscriptionId ||
      user.subscription.status !== "trialing"
    ) {
      throw new Error("No active trial found to end.");
    }

    try {
      const subscription = await this.stripe.subscriptions.update(
        user.subscription.subscriptionId,
        {
          trial_end: "now",
          proration_behavior: "none",
          expand: ["latest_invoice"],
        }
      );

      const plan = await this.planService.findPlanById(
        user.subscription.planId
      );

      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        user.subscription.subscriptionId
      );
      const currentPriceId = stripeSubscription.items.data[0].price.id;

      const isYearly = currentPriceId === plan.yearlyPriceId;
      const now = Date.now();
      let calculatedEndTime;

      if (isYearly) {
        calculatedEndTime = now + 365 * 24 * 60 * 60 * 1000;
      } else {
        calculatedEndTime = now + 30 * 24 * 60 * 60 * 1000;
      }

      const fallbackSubscription = {
        ...subscription,
        current_period_start: Math.floor(now / 1000),
        current_period_end: Math.floor(calculatedEndTime / 1000),
      };

      const updatedHistory = await this.processSubscriptionTransition(
        user,
        plan,
        "trial_to_paid",
        fallbackSubscription,
        isYearly
      );

      const updatedSubscriptionData = {
        subscriptionId: subscription.id,
        planId: user.subscription.planId,
        planName: user.subscription.planName,
        status: subscription.status,
        current_period_start: new Date(
          fallbackSubscription.current_period_start * 1000
        ),
        current_period_end: new Date(
          fallbackSubscription.current_period_end * 1000
        ),
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
      };

      await this.userService.updateUser(user._id, {
        subscription: updatedSubscriptionData,
        subscriptionHistory: updatedHistory,
      });

      const invoice = subscription.latest_invoice;
      if (invoice && invoice.status === "paid") {
        await this.processSubscriptionConfirmationEmail(invoice);
      }

      return {
        message: "Your trial has ended. Your paid subscription is now active.",
        status: "active",
      };
    } catch (error) {
      console.error(`Stripe error ending trial for user ${userId}:`, error);
      throw new Error(
        "Could not activate your subscription. Please check your payment method or contact support."
      );
    }
  }

  /**
   * Marks expired subscription history entries as "expired".
   */
  async handleSubscriptionExpiry(userId) {
    const user = await this.userService.findUserById(userId);
    if (!user || !user.subscriptionHistory) return;

    const now = new Date();
    let hasChanges = false;

    user.subscriptionHistory.forEach((entry) => {
      if (
        entry.status === "active" &&
        entry.endDate &&
        new Date(entry.endDate) < now
      ) {
        entry.status = "expired";
        hasChanges = true;
      }
    });

    if (hasChanges) {
      await user.save();
    }
  }

  /**
   * REWRITTEN: Gets status using the new accurate User model methods.
   */
  async getSubscriptionStatus(userId) {
    try {
      const user = await this.userService.findUserById(userId);
      if (!user || !user.subscription) {
        return {
          hasActiveSubscription: false,
          canCreatePackages: false,
          reason: "No subscription found.",
          status: "INACTIVE",
        };
      }

      const { status } = user.subscription;

      if (!["active", "trialing"].includes(status)) {
        return {
          hasActiveSubscription: false,
          canCreatePackages: false,
          reason: `Your subscription is currently ${status}. An active plan is required.`,
          status: "INACTIVE",
        };
      }

      const canCreate = user.canCreateDocument();

      if (!canCreate) {
        return {
          hasActiveSubscription: true,
          canCreatePackages: false,
          reason: "You have reached your document limit.",
          status: "LIMIT_REACHED",
          documentsUsed: user.getTotalDocumentsUsed(),
          documentLimit: user.getTotalDocumentLimit(),
        };
      }

      return {
        hasActiveSubscription: true,
        canCreatePackages: true,
        reason: "Subscription is active.",
        status: "ACTIVE",
        documentsUsed: user.getTotalDocumentsUsed(),
        documentLimit: user.getTotalDocumentLimit(),
      };
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      return {
        hasActiveSubscription: false,
        canCreatePackages: false,
        reason: "Could not verify subscription status.",
        status: "INACTIVE",
      };
    }
  }

  /**
   * FIXED: Properly handles new subscriptions, trial-to-paid, AND upgrades/top-ups
   * - Sets hasHadTrial to true on first paid purchase
   * - Handles missing subscription object for new users
   */
  async createSubscription({ userId, priceId, paymentMethodId }) {
    try {
      const user = await this.userService.findUserById(userId);
      if (!user) throw new Error("User not found");

      const newPlan = await this.planService.findPlanByPriceId(priceId);
      if (!newPlan) throw new Error("Plan not found");

      // FIXED: Properly check subscription status with safe navigation
      const currentStatus = user.subscription?.status;
      const isTrialToPaid = currentStatus === "trialing";
      const isTopUp = currentStatus === "active" && !isTrialToPaid;
      const isFirstPurchase =
        !user.subscription || !user.subscription.subscriptionId;

      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: { userId: userId.toString() },
        });
        stripeCustomerId = customer.id;
      }

      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });
      await this.stripe.customers.update(stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      let subscription;
      let transitionType = "new";
      const isYearly = priceId === newPlan.yearlyPriceId;

      if (isTrialToPaid) {
        transitionType = "trial_to_paid";
        const currentSub = await this.stripe.subscriptions.retrieve(
          user.subscription.subscriptionId
        );

        console.log("BEFORE TRIAL-TO-PAID UPDATE:", {
          id: currentSub.id,
          status: currentSub.status,
          current_period_start: currentSub.current_period_start,
          current_period_end: currentSub.current_period_end,
        });

        subscription = await this.stripe.subscriptions.update(
          user.subscription.subscriptionId,
          {
            trial_end: "now",
            proration_behavior: "none",
            items: [{ id: currentSub.items.data[0].id, price: priceId }],
            expand: ["latest_invoice"],
          }
        );

        console.log("AFTER TRIAL-TO-PAID UPDATE:", {
          id: subscription.id,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
        });

        if (
          !subscription.current_period_start ||
          !subscription.current_period_end
        ) {
          console.log(
            "Trial-to-paid missing period dates, calculating based on plan interval..."
          );

          const now = Date.now();
          const calculatedEndTime = isYearly
            ? now + 365 * 24 * 60 * 60 * 1000
            : now + 30 * 24 * 60 * 60 * 1000;

          subscription = {
            ...subscription,
            current_period_start: Math.floor(now / 1000),
            current_period_end: Math.floor(calculatedEndTime / 1000),
          };

          console.log("Calculated dates for trial-to-paid:", {
            id: subscription.id,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            interval: isYearly ? "yearly" : "monthly",
          });
        }
      } else if (isTopUp) {
        transitionType = "top_up";
        const currentSub = await this.stripe.subscriptions.retrieve(
          user.subscription.subscriptionId
        );
        subscription = await this.stripe.subscriptions.update(
          user.subscription.subscriptionId,
          {
            proration_behavior: "create_prorations",
            items: [{ id: currentSub.items.data[0].id, price: priceId }],
            expand: ["latest_invoice"],
          }
        );

        if (
          !subscription.current_period_start ||
          !subscription.current_period_end
        ) {
          console.log(
            "Top-up missing period dates, calculating based on plan interval..."
          );

          const now = Date.now();
          const calculatedEndTime = isYearly
            ? now + 365 * 24 * 60 * 60 * 1000
            : now + 30 * 24 * 60 * 60 * 1000;

          subscription = {
            ...subscription,
            current_period_start: Math.floor(now / 1000),
            current_period_end: Math.floor(calculatedEndTime / 1000),
          };
        }
      } else {
        // NEW SUBSCRIPTION - First time purchase
        subscription = await this.stripe.subscriptions.create({
          customer: stripeCustomerId,
          items: [{ price: priceId }],
          default_payment_method: paymentMethodId,
          expand: ["latest_invoice"],
        });

        if (
          !subscription.current_period_start ||
          !subscription.current_period_end
        ) {
          console.log(
            "New subscription missing period dates, calculating based on plan interval..."
          );

          const now = Date.now();
          const calculatedEndTime = isYearly
            ? now + 365 * 24 * 60 * 60 * 1000
            : now + 30 * 24 * 60 * 60 * 1000;

          subscription = {
            ...subscription,
            current_period_start: Math.floor(now / 1000),
            current_period_end: Math.floor(calculatedEndTime / 1000),
          };
        }
      }

      const updatedHistory = await this.processSubscriptionTransition(
        user,
        newPlan,
        transitionType,
        subscription,
        isYearly
      );

      const updatedSubscriptionData = {
        subscriptionId: subscription.id,
        planId: newPlan._id,
        planName: newPlan.name,
        status: subscription.status,
        current_period_start: new Date(
          subscription.current_period_start * 1000
        ),
        current_period_end: new Date(subscription.current_period_end * 1000),
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
      };

      // FIXED: Set hasHadTrial to true on first paid purchase
      const updateData = {
        stripeCustomerId,
        subscription: updatedSubscriptionData,
        subscriptionHistory: updatedHistory,
      };

      // If this is their first purchase (not a trial conversion), mark trial as used
      if (isFirstPurchase && !user.hasHadTrial) {
        updateData.hasHadTrial = true;
      }

      await this.userService.updateUser(user._id, updateData);

      const updatedUser = await this.userService.findUserById(userId);

      return {
        id: subscription.id,
        status: subscription.status,
        latest_invoice: subscription.latest_invoice,
        effectiveLimit: updatedUser.getTotalDocumentLimit(),
        message: isTopUp
          ? `Upgrade successful! You now have ${updatedUser.getRemainingDocuments()} documents available.`
          : "Subscription created successfully!",
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
      return [];
    }

    const invoices = await this.stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 24,
    });

    return invoices.data.map((invoice) => ({
      id: invoice.id,
      createdAt: new Date(invoice.created * 1000),
      amount: (invoice.total / 100).toFixed(2),
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
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
      console.error(
        `[Non-blocking] Failed to send cancellation email for user ${userId}:`,
        emailError
      );
    }

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

    return {
      message:
        "Your subscription has been reactivated and will now auto-renew.",
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      renewsAt: new Date(updatedSubscription.current_period_end * 1000),
    };
  }

  /**
   * FIXED: Handles subscription updates from Stripe webhooks.
   * Now correctly identifies new trials vs renewals.
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
        console.log(
          `No user found for customer ${stripeSubscription.customer}`
        );
        return;
      }

      // CRITICAL FIX: Skip webhook processing if dates are missing
      // The creation methods handle this properly
      if (
        !stripeSubscription.current_period_start ||
        !stripeSubscription.current_period_end
      ) {
        console.warn(
          `Missing period dates for subscription ${subscriptionId}, skipping webhook update`
        );
        return;
      }

      const currentPeriodStart = new Date(
        stripeSubscription.current_period_start * 1000
      );
      const currentPeriodEnd = new Date(
        stripeSubscription.current_period_end * 1000
      );

      // Validate dates
      if (
        isNaN(currentPeriodStart.getTime()) ||
        isNaN(currentPeriodEnd.getTime())
      ) {
        console.error(
          `Invalid dates from Stripe for subscription ${subscriptionId}`
        );
        return;
      }

      // CRITICAL FIX: Detect if this is a brand new subscription
      const isNewSubscription =
        !user.subscription || !user.subscription.subscriptionId;
      const isNewTrial =
        isNewSubscription && stripeSubscription.status === "trialing";

      if (isNewTrial) {
        console.log(
          `New trial detected for ${subscriptionId}, skipping webhook update (already handled by createTrialSubscription)`
        );
        return; // Don't process - createTrialSubscription already set everything up
      }

      // CRITICAL FIX: Only consider it a renewal if:
      // 1. User already has a subscription
      // 2. The new period start is AFTER the old period start
      // 3. This is not a status-only update (like trialing -> active)
      const oldPeriodStart = user.subscription?.current_period_start?.getTime();
      const newPeriodStart = currentPeriodStart.getTime();

      const isRenewal =
        oldPeriodStart &&
        newPeriodStart > oldPeriodStart &&
        user.subscription.subscriptionId === subscriptionId;

      if (isRenewal) {
        console.log(`Processing renewal for subscription ${subscriptionId}`);

        const plan = await this.planService.findPlanById(
          user.subscription.planId
        );

        if (plan) {
          // Expire old entries
          user.subscriptionHistory.forEach((entry) => {
            if (entry.status === "active") {
              entry.status = "expired";
              entry.endDate = new Date();
            }
          });

          // Create a new active entry for the new period
          user.subscriptionHistory.push({
            type: "paid",
            planId: plan._id,
            planName: plan.name,
            startDate: currentPeriodStart,
            endDate: currentPeriodEnd,
            documentLimit: plan.documentLimit,
            documentsUsed: 0,
            status: "active",
          });
        }
      }

      // Get the current plan info
      const currentPriceId = stripeSubscription.items?.data[0]?.price?.id;
      let updatedPlan = null;

      if (currentPriceId) {
        updatedPlan = await this.planService.findPlanByPriceId(currentPriceId);
      }

      // Prepare update data - only update status and timestamps for non-renewals
      const updateData = {
        "subscription.status": stripeSubscription.status,
        "subscription.current_period_start": currentPeriodStart,
        "subscription.current_period_end": currentPeriodEnd,
      };

      // Only update history if we processed a renewal
      if (isRenewal) {
        updateData.subscriptionHistory = user.subscriptionHistory;
      }

      // Only update plan details if we found a matching plan
      if (updatedPlan) {
        updateData["subscription.planId"] = updatedPlan._id;
        updateData["subscription.planName"] = updatedPlan.name;
      }

      // Handle trial_end if present
      if (stripeSubscription.trial_end) {
        updateData["subscription.trial_end"] = new Date(
          stripeSubscription.trial_end * 1000
        );
      }

      await this.userService.updateUser(user._id, updateData);

      console.log(
        `Successfully updated subscription ${subscriptionId} for user ${
          user._id
        } (${isRenewal ? "renewal" : "status update"})`
      );
    } catch (error) {
      console.error(
        `Error in handleSubscriptionUpdate for ${subscriptionId}:`,
        error
      );
      // Don't throw - we don't want to fail the webhook
    }
  }
  
  /**
   * Handles subscription cancellations that come from outside our app.
   */
  async handleSubscriptionDeleted(subscriptionId) {
    const user = await this.userService.findUserBySubscriptionId(
      subscriptionId
    );
    if (!user) {
      console.error(`User not found for subscription: ${subscriptionId}`);
      return;
    }

    // Expire all active subscription history
    if (user.subscriptionHistory) {
      user.subscriptionHistory.forEach((entry) => {
        if (entry.status === "active") {
          entry.status = "expired";
          entry.endDate = new Date();
        }
      });
    }

    await this.userService.updateUser(user._id, {
      subscription: undefined,
      subscriptionHistory: user.subscriptionHistory,
    });

    console.log(`Subscription ${subscriptionId} deleted for user ${user._id}`);
  }
  /**
   * Sends subscription confirmation email after a successful payment.
   */
  async processSubscriptionConfirmationEmail(invoice) {
    try {
      const user = await this.userService.findUserByStripeCustomerId(
        invoice.customer
      );
      if (!user || !user.subscription || !user.subscription.planName) {
        console.error(
          `Could not process confirmation: User or subscription details missing for customer ID ${invoice.customer}`
        );
        return;
      }

      const planName = user.subscription.planName;
      const amount = (invoice.amount_paid / 100).toFixed(2);
      const renewalDateTimestamp = invoice.lines.data[0]?.period?.end;
      const renewalDate = renewalDateTimestamp
        ? new Date(renewalDateTimestamp * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "N/A";
      const invoiceUrl = invoice.hosted_invoice_url;

      await this.emailService.sendSubscriptionConfirmation(
        user.email,
        user.firstName,
        planName,
        amount,
        renewalDate,
        invoiceUrl
      );
    } catch (error) {
      console.error("Error processing subscription confirmation email:", error);
    }
  }

  /**
   * REWRITTEN: Correctly handles document limits and history for upgrades, trials, and new subs.
   * FIX APPLIED: Properly set endDate for paid subscriptions from Stripe period_end
   */
  async processSubscriptionTransition(
    user,
    newPlan,
    transitionType,
    stripeSub,
    isYearly
  ) {
    const now = new Date();
    const history = user.subscriptionHistory || [];
    let newHistoryLimit = newPlan.documentLimit;

    if (transitionType === "trial_to_paid") {
      // Deactivate the old trial history
      history.forEach((h) => {
        if (h.type === "trial" && h.status === "active") {
          h.status = "completed";
          h.endDate = now;
        }
      });
    } else if (transitionType === "top_up" && user.subscription) {
      // Calculate remaining documents from all active plans
      const remainingDocsFromOldPlan = user.getRemainingDocuments();

      // Prorate the document limit for the new plan
      const periodStart = stripeSub.current_period_start;
      const periodEnd = stripeSub.current_period_end;
      const nowSeconds = Math.floor(Date.now() / 1000);
      const totalDuration = periodEnd - periodStart;
      const remainingDuration = periodEnd - nowSeconds;

      let proratedNewDocs = newPlan.documentLimit;
      if (totalDuration > 0 && remainingDuration > 0) {
        const fraction = remainingDuration / totalDuration;
        proratedNewDocs = Math.floor(fraction * newPlan.documentLimit);
      }

      // The total limit for the new history entry is what they had left + the prorated new amount
      newHistoryLimit = remainingDocsFromOldPlan + proratedNewDocs;

      // Deactivate all previous active plans
      history.forEach((h) => {
        if (h.status === "active") {
          h.status = "completed";
          h.endDate = now;
        }
      });
    }

    // CRITICAL FIX: Ensure we have a valid end date from Stripe
    let endDate;
    if (stripeSub.current_period_end) {
      endDate = new Date(stripeSub.current_period_end * 1000);
    } else {
      // Fallback: set to 30 or 365 days from now if Stripe doesn't provide the date
      console.warn("No current_period_end from Stripe, using fallback");
      endDate = new Date(
        now.getTime() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000
      );
    }

    // Add the new active entry
    // FIXED: Map transitionType to valid enum values
    let historyType;
    if (transitionType === "top_up") {
      historyType = "top_up";
    } else if (transitionType === "trial_to_paid") {
      historyType = "paid";
    } else {
      // transitionType === "new" should be saved as "paid"
      historyType = "paid";
    }

    const newHistoryEntry = {
      type: historyType,
      planId: newPlan._id,
      planName: newPlan.name,
      startDate: now,
      endDate: endDate,
      documentLimit: newHistoryLimit,
      documentsUsed: 0,
      status: "active",
    };

    history.push(newHistoryEntry);

    return history;
  }
}

module.exports = SubscriptionService;
