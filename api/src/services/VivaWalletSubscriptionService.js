// src/services/VivaWalletSubscriptionService.js

const vivaConfig = require("../config/vivaWalletConfig");

class VivaWalletSubscriptionService {
  constructor({
    Plan,
    User,
    UsedTrialFingerprintModel,
    emailService,
    planService,
    userService,
    vivaWalletPaymentService,
    vivaWalletInvoiceService,
  }) {
    this.Plan = Plan;
    this.User = User;
    this.UsedTrialFingerprint = UsedTrialFingerprintModel;
    this.emailService = emailService;
    this.planService = planService;
    this.userService = userService;
    this.vivaWalletPaymentService = vivaWalletPaymentService;
    this.vivaWalletInvoiceService = vivaWalletInvoiceService;
  }

  /**
   * Get all available plans
   */
  async getAllPlans() {
    const plans = await this.Plan.find({}).sort({ monthlyPrice: 1 });
    if (!plans) {
      throw new Error("No subscription plans found.");
    }
    return plans;
  }

  /**
   * Get user's current subscription details
   */
  async getSubscription(userId) {
    try {
      const user = await this.userService.findUserById(userId);
      if (!user || !user.subscription || !user.subscription.subscriptionId) {
        throw new Error("No subscription found.");
      }

      const isTrialing = user.subscription.status === "trialing";
      const billingInterval = user.subscription.billingInterval || "month"; // ✅ Get from user

      const result = {
        planName: user.subscription.planName,
        documentLimit: user.getTotalDocumentLimit(),
        documentsUsed: user.getTotalDocumentsUsed(),
        status: user.subscription.status,
        renewsAt: user.subscription.current_period_end?.toISOString() || null,
        startDate:
          user.subscription.current_period_start?.toISOString() || null,
        cancelAtPeriodEnd: false,
        planPrice: "N/A",
        planInterval: billingInterval, // ✅ FIXED: Use stored interval
        isTrialing: isTrialing,
        trialEndDate:
          isTrialing && user.subscription.trial_end
            ? user.subscription.trial_end.toISOString()
            : null,
      };

      // Get plan details for pricing
      if (user.subscription.planId) {
        const plan = await this.planService.findPlanById(
          user.subscription.planId
        );
        if (plan) {
          // ✅ FIXED: Use correct price based on billing interval
          const isYearly = billingInterval === "year";
          result.planPrice = isYearly
            ? (plan.yearlyPrice / 100).toFixed(2)
            : (plan.monthlyPrice / 100).toFixed(2);
        }
      }

      return result;
    } catch (error) {
      throw new Error(error.message || "Failed to fetch subscription details.");
    }
  }

  /**
   * Get subscription status for package creation check
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
   * Create a trial subscription (14 days, 3 documents)
   */
  async createTrialSubscription({
    userId,
    planId,
    paymentMethodId,
    billingInterval = "month",
  }) {
    try {
      const user = await this.userService.findUserById(userId);
      if (!user) throw new Error("User not found");

      const plan = await this.planService.findPlanById(planId);
      if (!plan) throw new Error("Plan not found");

      if (user.hasHadTrial) {
        throw new Error("This account has already used a free trial.");
      }

      // Get payment source to check fingerprint (card verification)
      const paymentSources =
        await this.vivaWalletPaymentService.getPaymentSources(userId);
      const paymentSource = paymentSources.paymentSources.find(
        (s) => s.id === paymentMethodId
      );

      if (!paymentSource) {
        throw new Error(
          "Payment method not found. Please add a payment method first."
        );
      }

      // Check if this card has been used for trial before
      // Note: Viva Wallet doesn't provide card fingerprints, so we'll use transactionId
      const fingerprint = paymentSource.transactionId;
      const existingFingerprint = await this.UsedTrialFingerprint.findOne({
        fingerprint,
      });

      if (existingFingerprint) {
        throw new Error(
          "This payment method has already been used for a free trial."
        );
      }

      // Calculate trial dates
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14); // 14 days trial

      // Create subscription ID (we manage this internally for trials)
      const subscriptionId = `TRIAL_${userId}_${Date.now()}`;

      // Initialize subscription history for the trial
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

      // Update user with trial subscription
      await this.userService.updateUser(userId, {
        vivaWalletCustomerId: user.vivaWalletCustomerId || user.email,
        subscription: {
          subscriptionId: subscriptionId,
          planId: plan._id,
          planName: plan.name,
          status: "trialing",
          current_period_start: trialStartDate,
          current_period_end: trialEndDate,
          trial_end: trialEndDate,
          billingInterval: billingInterval,
        },
        hasHadTrial: true,
        subscriptionHistory: [trialHistory],
      });

      // Save fingerprint to prevent abuse
      await this.UsedTrialFingerprint.create({ fingerprint, usedBy: userId });

      // Send trial activation email
      try {
        await this.emailService.sendTrialActivationEmail(
          user,
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

      console.log(`✅ Trial subscription created for user ${userId}`);

      return {
        id: subscriptionId,
        status: "trialing",
        trial_end: trialEndDate.toISOString(),
      };
    } catch (error) {
      console.error("Error creating trial subscription:", error);
      throw error;
    }
  }

  /**
   * ✅ CHANGE 1: Remove email from endTrialEarly
   * Let webhook handle the confirmation email
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
      const defaultPaymentSourceId =
        await this.vivaWalletPaymentService.getDefaultPaymentSource(userId);
      const paymentSources =
        await this.vivaWalletPaymentService.getPaymentSources(userId);
      const paymentSource = paymentSources.paymentSources.find(
        (s) => s.id === defaultPaymentSourceId
      );

      if (!paymentSource) {
        throw new Error(
          "No payment method found. Please add a payment method first."
        );
      }

      const plan = await this.planService.findPlanById(
        user.subscription.planId
      );
      if (!plan) throw new Error("Plan not found");

      // ✅ FIX: Use billing interval from user's subscription
      const billingInterval = user.subscription.billingInterval || "month";
      const isYearly = billingInterval === "year";
      const amount = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

      console.log(`💳 Processing payment to end trial for user ${userId}...`);
      console.log(`   Billing: ${billingInterval}, Amount: €${amount / 100}`);

      const recurringPaymentData = {
        Amount: amount,
        CustomerTrns: `${plan.name} subscription activation`,
        MerchantTrns: `TRIAL_TO_PAID_${userId}_${Date.now()}`, // ✅ Webhook will catch this
        SourceCode: vivaConfig.sourceCode,
      };

      const client = vivaConfig.createBasicAuthClient();
      const paymentResponse = await client.post(
        `/api/transactions/${paymentSource.transactionId}`,
        recurringPaymentData
      );

      if (paymentResponse.data.StatusId !== "F") {
        throw new Error(
          `Payment failed: ${paymentResponse.data.ErrorText || "Unknown error"}`
        );
      }

      const newTransactionId = paymentResponse.data.TransactionId;
      console.log(`✅ Payment successful: ${newTransactionId}`);

      const now = new Date();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      if (isYearly) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      user.subscriptionHistory.forEach((entry) => {
        if (entry.type === "trial" && entry.status === "active") {
          entry.status = "completed";
          entry.endDate = now;
        }
      });

      user.subscriptionHistory.push({
        type: "paid",
        planId: plan._id,
        planName: plan.name,
        startDate: now,
        endDate: periodEnd,
        documentLimit: plan.documentLimit,
        documentsUsed: 0,
        status: "active",
      });

      const updatedSubscription = {
        subscriptionId: newTransactionId,
        planId: plan._id,
        planName: plan.name,
        status: "active",
        current_period_start: now,
        current_period_end: periodEnd,
        trial_end: null,
        billingInterval: billingInterval,
      };

      await this.userService.updateUser(userId, {
        subscription: updatedSubscription,
        subscriptionHistory: user.subscriptionHistory,
      });

      // ❌ REMOVED: Don't send email here
      // ✅ Webhook will send email when it confirms the transaction
      console.log(
        `✅ Trial ended and subscription activated for user ${userId} (email will be sent by webhook)`
      );

      return {
        message: "Your trial has ended. Your paid subscription is now active.",
        status: "active",
      };
    } catch (error) {
      console.error(`Error ending trial for user ${userId}:`, error);
      throw new Error(
        "Could not activate your subscription. Please check your payment method or contact support."
      );
    }
  }

  /**
   * ✅ CHANGE 2: Remove email from createSubscription for NEW subscriptions
   * Keep email ONLY for upgrades/downgrades
   */
  async createSubscription({ userId, planId, billingInterval = "month" }) {
    try {
      const user = await this.userService.findUserById(userId);
      if (!user) throw new Error("User not found");

      const newPlan = await this.planService.findPlanById(planId);
      if (!newPlan) throw new Error("Plan not found");

      const currentStatus = user.subscription?.status;
      const isTrialToPaid = currentStatus === "trialing";
      const isUpgradeOrDowngrade = currentStatus === "active" && !isTrialToPaid;
      const isFirstPurchase =
        !user.subscription || !user.subscription.subscriptionId;

      const defaultPaymentSourceId =
        await this.vivaWalletPaymentService.getDefaultPaymentSource(userId);
      const paymentSources =
        await this.vivaWalletPaymentService.getPaymentSources(userId);
      const paymentSource = paymentSources.paymentSources.find(
        (s) => s.id === defaultPaymentSourceId
      );

      if (!paymentSource) {
        throw new Error(
          "No payment method found. Please add a payment method first."
        );
      }

      const isYearly = billingInterval === "year";
      const amount = isYearly ? newPlan.yearlyPrice : newPlan.monthlyPrice;

      let transitionType = "new";
      let newTransactionId;

      const now = new Date();
      const periodEnd = new Date();
      if (isYearly) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      if (isTrialToPaid) {
        transitionType = "trial_to_paid";
        console.log("Converting trial to paid subscription");

        const credentials = Buffer.from(
          `${vivaConfig.merchantId}:${vivaConfig.apiKey}`
        ).toString("base64");

        const recurringPaymentData = {
          Amount: amount,
          CustomerTrns: `${newPlan.name} subscription (trial conversion)`,
          MerchantTrns: `TRIAL_CONVERT_${userId}_${Date.now()}`, // ✅ Webhook will catch this
          SourceCode: vivaConfig.sourceCode,
        };

        const client = vivaConfig.createBasicAuthClient();
        const paymentResponse = await client.post(
          `/api/transactions/${paymentSource.transactionId}`,
          recurringPaymentData
        );

        if (paymentResponse.data.StatusId !== "F") {
          throw new Error(
            `Payment failed: ${
              paymentResponse.data.ErrorText || "Unknown error"
            }`
          );
        }

        newTransactionId = paymentResponse.data.TransactionId;
        console.log(
          `✅ Trial conversion payment successful: ${newTransactionId}`
        );

        // ❌ REMOVED: Don't send email here
        // ✅ Webhook will send email
      } else if (isUpgradeOrDowngrade) {
        transitionType = "upgrade_downgrade";
        console.log(`Processing upgrade/downgrade to ${newPlan.name}`);

        const credentials = Buffer.from(
          `${vivaConfig.merchantId}:${vivaConfig.apiKey}`
        ).toString("base64");

        const recurringPaymentData = {
          Amount: amount,
          CustomerTrns: `${newPlan.name} subscription (plan change)`,
          MerchantTrns: `PLAN_CHANGE_${userId}_${Date.now()}`,
          SourceCode: vivaConfig.sourceCode,
        };

        const client = vivaConfig.createBasicAuthClient();
        const paymentResponse = await client.post(
          `/api/transactions/${paymentSource.transactionId}`,
          recurringPaymentData
        );

        if (paymentResponse.data.StatusId !== "F") {
          throw new Error(
            `Payment failed: ${
              paymentResponse.data.ErrorText || "Unknown error"
            }`
          );
        }

        newTransactionId = paymentResponse.data.TransactionId;
        console.log(`✅ Plan change payment successful: ${newTransactionId}`);

        // ✅ KEPT: Send email immediately for upgrades/downgrades
        // Reason: Immediate change, user expects instant confirmation
        try {
          await this.emailService.sendSubscriptionConfirmation(
            user,
            newPlan.name,
            amount,
            periodEnd,
            null
          );
          console.log(
            `Upgrade/downgrade confirmation email sent to ${user.email}`
          );
        } catch (emailError) {
          console.error(`Failed to send upgrade/downgrade email:`, emailError);
        }
      } else {
        // New subscription
        console.log("Creating new subscription");

        const credentials = Buffer.from(
          `${vivaConfig.merchantId}:${vivaConfig.apiKey}`
        ).toString("base64");

        const recurringPaymentData = {
          Amount: amount,
          CustomerTrns: `${newPlan.name} subscription`,
          MerchantTrns: `NEW_SUB_${userId}_${Date.now()}`, // ✅ Webhook will catch this
          SourceCode: vivaConfig.sourceCode,
        };

        const client = vivaConfig.createBasicAuthClient();
        const paymentResponse = await client.post(
          `/api/transactions/${paymentSource.transactionId}`,
          recurringPaymentData
        );

        if (paymentResponse.data.StatusId !== "F") {
          throw new Error(
            `Payment failed: ${
              paymentResponse.data.ErrorText || "Unknown error"
            }`
          );
        }

        newTransactionId = paymentResponse.data.TransactionId;
        console.log(
          `✅ New subscription payment successful: ${newTransactionId}`
        );

        // ❌ REMOVED: Don't send email here
        // ✅ Webhook will send email
      }

      const updatedHistory = await this.processSubscriptionTransition(
        user,
        newPlan,
        transitionType,
        { current_period_end: periodEnd },
        isYearly
      );

      const updatedSubscriptionData = {
        subscriptionId: newTransactionId,
        planId: newPlan._id,
        planName: newPlan.name,
        status: "active",
        current_period_start: now,
        current_period_end: periodEnd,
        trial_end: null,
        billingInterval: billingInterval,
      };

      const updateData = {
        vivaWalletCustomerId: user.vivaWalletCustomerId || user.email,
        subscription: updatedSubscriptionData,
        subscriptionHistory: updatedHistory,
      };

      if (isFirstPurchase && !user.hasHadTrial) {
        updateData.hasHadTrial = true;
      }

      await this.userService.updateUser(user._id, updateData);
      const updatedUser = await this.userService.findUserById(userId);

      console.log(
        `✅ Subscription created for user ${userId} (email: ${
          isUpgradeOrDowngrade ? "sent immediately" : "will be sent by webhook"
        })`
      );

      return {
        id: newTransactionId,
        status: "active",
        effectiveLimit: updatedUser.getTotalDocumentLimit(),
        message: isUpgradeOrDowngrade
          ? `Plan changed successfully! You now have ${updatedUser.getRemainingDocuments()} documents available.`
          : "Subscription created successfully!",
      };
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  }

  /**
   * Process subscription transition (upgrade/downgrade/trial-to-paid)
   */
  async processSubscriptionTransition(
    user,
    newPlan,
    transitionType,
    subscription,
    isYearly
  ) {
    const now = new Date();
    const history = user.subscriptionHistory || [];

    // Calculate current remaining documents
    const currentRemainingDocs = user.getRemainingDocuments();
    let newHistoryLimit = newPlan.documentLimit;

    if (transitionType === "trial_to_paid") {
      // Deactivate trial history
      history.forEach((h) => {
        if (h.type === "trial" && h.status === "active") {
          h.status = "completed";
          h.endDate = now;
        }
      });
    } else if (transitionType === "upgrade_downgrade") {
      // Carry over remaining documents
      newHistoryLimit = currentRemainingDocs + newPlan.documentLimit;

      console.log(`Upgrade/downgrade document calculation:`);
      console.log(`- Current remaining: ${currentRemainingDocs}`);
      console.log(`- New plan base: ${newPlan.documentLimit}`);
      console.log(`- New total: ${newHistoryLimit}`);

      // Deactivate previous active plans
      history.forEach((h) => {
        if (h.status === "active") {
          h.status = "completed";
          h.endDate = now;
        }
      });
    }

    // Calculate end date
    const endDate =
      subscription.current_period_end ||
      new Date(now.getTime() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000);

    // Add new active entry
    const newHistoryEntry = {
      type:
        transitionType === "trial_to_paid" ||
        transitionType === "upgrade_downgrade"
          ? "paid"
          : "paid",
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

  /**
   * Cancel subscription (disable auto-renewal)
   */
  async cancelSubscription(userId) {
    const user = await this.User.findById(userId).select(
      "subscription email firstName language"
    );
    if (!user || !user.subscription || !user.subscription.subscriptionId) {
      throw new Error("No active subscription to cancel.");
    }

    // Note: Viva Wallet recurring payments continue until explicitly cancelled
    // We mark the subscription as cancelled in our system
    await this.userService.updateUser(userId, {
      "subscription.status": "canceled",
    });

    const plan = await this.planService.findPlanById(user.subscription.planId);

    try {
      await this.emailService.sendCancellationConfirmation(
        user,
        plan?.name || "Your subscription",
        user.subscription.current_period_end
      );
    } catch (emailError) {
      console.error(
        `[Non-blocking] Failed to send cancellation email for user ${userId}:`,
        emailError
      );
    }

    console.log(`✅ Subscription cancelled for user ${userId}`);

    return {
      message:
        "Your subscription has been cancelled and will remain active until your current billing period ends.",
      cancelAtPeriodEnd: true,
      renewsAt: user.subscription.current_period_end,
    };
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(userId) {
    const user = await this.User.findById(userId).select(
      "subscription email firstName language"
    );
    if (!user || !user.subscription || !user.subscription.subscriptionId) {
      throw new Error("No subscription found to reactivate.");
    }

    // ✅ FIX: Preserve trialing status if trial is still active
    const isStillTrialing =
      user.subscription.trial_end &&
      new Date(user.subscription.trial_end) > new Date();

    const newStatus = isStillTrialing ? "trialing" : "active";

    await this.userService.updateUser(userId, {
      "subscription.status": newStatus, // ✅ Use preserved status
    });

    try {
      await this.emailService.sendSubscriptionReactivation(
        user,
        user.subscription.planName,
        user.subscription.current_period_end
      );
    } catch (emailError) {
      console.error(
        `[Non-blocking] Failed to send reactivation email for user ${userId}:`,
        emailError
      );
    }

    console.log(
      `✅ Subscription reactivated for user ${userId} with status: ${newStatus}`
    );

    return {
      message:
        "Your subscription has been reactivated and will now auto-renew.",
      cancelAtPeriodEnd: false,
      renewsAt: user.subscription.current_period_end,
    };
  }

  /**
   * ✅ FIXED: List user invoices from Viva Wallet API
   */
  async listInvoices(userId) {
    try {
      const invoices = await this.vivaWalletInvoiceService.listInvoices(userId);

      console.log(`✅ Fetched ${invoices.length} invoices for user ${userId}`);
      return invoices;
    } catch (error) {
      console.error(`❌ Error fetching invoices for user ${userId}:`, error);
      // Return empty array on error (graceful degradation)
      return [];
    }
  }

  /**
   * ✅ NEW: Get invoice statistics
   */
  async getInvoiceStats(userId) {
    try {
      return await this.vivaWalletInvoiceService.getInvoiceStats(userId);
    } catch (error) {
      console.error(`❌ Error fetching invoice stats:`, error);
      return {
        totalInvoices: 0,
        totalPaid: "0.00",
        lastPaymentDate: null,
        lastPaymentAmount: "0.00",
        byType: {},
      };
    }
  }

  /**
   * ✅ NEW: Get detailed invoice information
   */
  async getInvoiceDetail(userId, invoiceId) {
    try {
      // Get invoice details from Viva Wallet
      const invoice = await this.vivaWalletInvoiceService.getInvoiceById(
        userId,
        invoiceId
      );

      // Get user information for the invoice
      const user = await this.userService.findUserById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      // Find the subscription history entry related to this transaction
      let subscriptionInfo = null;
      if (user.subscriptionHistory) {
        // Try to match by date or transaction type
        const invoiceDate = new Date(invoice.date);
        subscriptionInfo = user.subscriptionHistory.find((entry) => {
          const entryStart = new Date(entry.startDate);
          const entryEnd = entry.endDate ? new Date(entry.endDate) : new Date();
          return invoiceDate >= entryStart && invoiceDate <= entryEnd;
        });
      }

      // Enhance invoice with additional information
      const enhancedInvoice = {
        // Transaction Details
        id: invoice.id,
        date: invoice.date,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        description: invoice.description,
        transactionType: invoice.transactionType,

        // Payment Details
        cardLast4: invoice.cardLast4,
        cardType: invoice.cardType,

        // Customer Details
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,

        // Subscription Details (if available)
        planName: subscriptionInfo?.planName || "N/A",
        documentLimit: subscriptionInfo?.documentLimit || 0,

        // Billing Details
        billingAddress: {
          // Add if you have this information
          country: "N/A",
          city: "N/A",
        },

        // Additional metadata
        orderCode: invoice.orderCode,
        invoiceNumber: `INV-${invoice.id.slice(0, 8).toUpperCase()}`,

        // Full transaction details (optional, for debugging)
        fullDetails: invoice.fullDetails,
      };

      console.log(
        `✅ Retrieved detailed invoice ${invoiceId} for user ${userId}`
      );
      return enhancedInvoice;
    } catch (error) {
      console.error(`❌ Error fetching invoice detail ${invoiceId}:`, error);
      throw error;
    }
  }

  /**
   * Handle subscription expiry
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
}

module.exports = VivaWalletSubscriptionService;
