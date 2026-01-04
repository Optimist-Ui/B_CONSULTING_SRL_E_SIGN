// src/jobs/SubscriptionExpiryJob.js

const BaseJob = require("./BaseJob");
const vivaConfig = require("../config/vivaWalletConfig");

class SubscriptionExpiryJob extends BaseJob {
  constructor(container) {
    super(container);
    this.vivaWalletSubscriptionService = container.resolve(
      "vivaWalletSubscriptionService"
    );
    this.userService = container.resolve("userService");
    this.emailService = container.resolve("emailService");
    this.planService = container.resolve("planService");
    this.User = container.resolve("User");
  }

  /**
   * Run every hour at minute 0
   */
  get schedule() {
    return "0 * * * *"; // Every hour on the hour
  }

  /**
   * Execute the subscription expiry job
   */
  async execute() {
    const startTime = new Date();
    console.log(
      `Starting subscription expiry job at ${startTime.toISOString()}`
    );

    try {
      // ✅ Order matters: Check reminders, then renewals, then expiries
      const results = await Promise.all([
        this.processSubscriptionRenewals(),
        this.processSubscriptionExpiries(),
        this.processExpiryReminders(),
      ]);

      this.updateLastRun();

      const endTime = new Date();
      const duration = endTime - startTime;

      console.log(
        `Subscription expiry job completed in ${duration}ms. ` +
          `Renewals: ${results[0].renewed}/${results[0].attempted}, ` +
          `Expired: ${results[1].expired} entries, ` +
          `Reminders sent: ${results[2].remindersSent}`
      );

      return {
        renewals: results[0],
        expiries: results[1],
        reminders: results[2],
      };
    } catch (error) {
      console.error("Error in SubscriptionExpiryJob execution:", error);
      throw error;
    }
  }

  /**
   * Process subscription renewals (3 days before expiry)
   */
  async processSubscriptionRenewals() {
    let attempted = 0;
    let renewed = 0;
    let failed = 0;

    try {
      const now = new Date();
      const threeDaysFromNow = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000
      );

      // Find subscriptions expiring in 3 days or less
      // ✅ FIX: Added status "trialing" to be picked up for renewal conversion
      const usersNeedingRenewal = await this.User.find({
        "subscription.status": { $in: ["active", "trialing"] },
        "subscription.current_period_end": {
          $lte: threeDaysFromNow,
          $gt: now, // strictly future (past is handled in expiries)
        },
      }).select(
        "subscription subscriptionHistory email firstName vivaWalletPaymentSources"
      );

      console.log(
        `Found ${usersNeedingRenewal.length} subscriptions due for renewal`
      );

      for (const user of usersNeedingRenewal) {
        try {
          attempted++;
          const success = await this.attemptRenewal(user);
          if (success) {
            renewed++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
          console.error(
            `Error renewing subscription for user ${user._id}:`,
            error
          );
        }
      }

      return { attempted, renewed, failed };
    } catch (error) {
      console.error("Error in processSubscriptionRenewals:", error);
      return { attempted, renewed, failed };
    }
  }

  /**
   * Attempt to renew a subscription using Viva Wallet recurring payment
   */
  async attemptRenewal(user) {
    try {
      console.log(`🔄 Attempting renewal for user ${user._id}`);

      // Get user's default payment method
      const paymentSources = user.vivaWalletPaymentSources || [];
      const defaultSource =
        paymentSources.find((s) => s.isDefault) || paymentSources[0];

      if (!defaultSource || !defaultSource.transactionId) {
        console.warn(`⚠️ No payment method found for user ${user._id}`);
        // Only mark past due if it was already active (don't mark trials as past_due yet)
        if (user.subscription.status === "active") {
          await this.markSubscriptionAsPastDue(user);
        }
        return false;
      }

      // Get plan details
      const plan = await this.planService.findPlanById(
        user.subscription.planId
      );
      if (!plan) {
        console.warn(`⚠️ Plan not found for user ${user._id}`);
        return false;
      }

      // Use billing interval from user's subscription
      const billingInterval = user.subscription.billingInterval || "month";
      const isYearly = billingInterval === "year";
      const amount = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

      console.log(`💳 Processing renewal payment for user ${user._id}...`);
      console.log(`   Billing: ${billingInterval}, Amount: €${amount / 100}`);

      const recurringPaymentData = {
        Amount: amount,
        CustomerTrns: `${plan.name} subscription renewal`,
        MerchantTrns: `AUTO_RENEWAL_${user._id}_${Date.now()}`,
        SourceCode: vivaConfig.sourceCode,
      };

      const client = vivaConfig.createBasicAuthClient();
      const paymentResponse = await client.post(
        `/api/transactions/${defaultSource.transactionId}`,
        recurringPaymentData
      );

      if (paymentResponse.data.StatusId !== "F") {
        console.error(`❌ Renewal payment failed for user ${user._id}`);
        await this.markSubscriptionAsPastDue(user);
        return false;
      }

      const newTransactionId = paymentResponse.data.TransactionId;
      console.log(`✅ Renewal payment successful: ${newTransactionId}`);

      // Calculate new period
      const now = new Date();
      // If renewing from the past (expired trial), start from NOW. If renewing active, start from END date.
      const oldEnd = new Date(user.subscription.current_period_end);
      const isLateRenewal = oldEnd < now;

      const newPeriodStart = isLateRenewal ? now : oldEnd;
      const newPeriodEnd = new Date(newPeriodStart);

      if (isYearly) {
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
      } else {
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      }

      // Update subscription history
      user.subscriptionHistory.forEach((entry) => {
        if (entry.status === "active" || entry.status === "trialing") {
          entry.status = "expired";
          if (!entry.endDate || entry.endDate > now) {
            entry.endDate = now;
          }
        }
      });

      // Add new period
      user.subscriptionHistory.push({
        type: "paid",
        planId: plan._id,
        planName: plan.name,
        startDate: newPeriodStart,
        endDate: newPeriodEnd,
        documentLimit: plan.documentLimit,
        documentsUsed: 0,
        status: "active",
      });

      // Update subscription
      user.subscription.subscriptionId = newTransactionId;
      user.subscription.current_period_start = newPeriodStart;
      user.subscription.current_period_end = newPeriodEnd;
      user.subscription.status = "active";
      user.subscription.billingInterval = billingInterval;

      // ✅ Reset reminder flag so they get reminded next month/year
      user.subscriptionExpiryReminderSent = null;

      await user.save();

      console.log(
        `✅ Subscription renewed for user ${
          user._id
        } until ${newPeriodEnd.toISOString()}`
      );

      // Send renewal confirmation email
      try {
        await this.emailService.sendSubscriptionConfirmation(
          user,
          plan.name,
          amount,
          newPeriodEnd,
          null
        );
      } catch (emailError) {
        console.error(
          `[Non-blocking] Failed to send renewal email:`,
          emailError
        );
      }

      return true;
    } catch (error) {
      console.error(
        `❌ Error renewing subscription for user ${user._id}:`,
        error
      );
      await this.markSubscriptionAsPastDue(user);
      return false;
    }
  }

  /**
   * Mark subscription as past_due when payment fails
   */
  async markSubscriptionAsPastDue(user) {
    try {
      user.subscription.status = "past_due";
      await user.save();

      console.log(`⚠️ Subscription marked as past_due for user ${user._id}`);

      try {
        const plan = await this.planService.findPlanById(
          user.subscription.planId
        );
        const billingInterval = user.subscription.billingInterval || "month";
        const isYearly = billingInterval === "year";
        const amount = plan
          ? isYearly
            ? plan.yearlyPrice
            : plan.monthlyPrice
          : 0;

        await this.emailService.sendPaymentFailedEmail(
          user.email,
          user.firstName,
          amount,
          "EUR",
          null
        );
      } catch (emailError) {
        console.error(
          `[Non-blocking] Failed to send payment failed email:`,
          emailError
        );
      }
    } catch (error) {
      console.error(`Error marking subscription as past_due:`, error);
    }
  }

  /**
   * Process subscription expiries for all users
   */
  async processSubscriptionExpiries() {
    let processed = 0;
    let expired = 0;

    try {
      const usersWithSubscriptions =
        await this.userService.findUsersWithSubscriptions();
      console.log(
        `Found ${usersWithSubscriptions.length} users with subscriptions to check`
      );

      for (const user of usersWithSubscriptions) {
        try {
          processed++;

          const originalHistory = user.subscriptionHistory || [];
          const originalExpired = originalHistory.filter(
            (h) => h.status === "expired"
          ).length;

          // Handle Viva Wallet internal expiry
          await this.vivaWalletSubscriptionService.handleSubscriptionExpiry(
            user._id
          );

          // Refresh user to check changes
          const updatedUser = await this.userService.findUserById(user._id);

          // Check if subscription itself has passed its end date
          if (
            updatedUser.subscription &&
            updatedUser.subscription.current_period_end &&
            new Date(updatedUser.subscription.current_period_end) < new Date()
          ) {
            // ✅ FIX: Don't just expire! Attempt to renew first.
            // This handles cases where the 'renewal' job missed the window
            // (e.g. job ran 15 mins after expiry) or it was a Trial converting to Paid.

            const isRenewableStatus = [
              "active",
              "trialing",
              "past_due",
            ].includes(updatedUser.subscription.status);
            const hasPaymentSource =
              updatedUser.vivaWalletPaymentSources &&
              updatedUser.vivaWalletPaymentSources.length > 0;

            if (isRenewableStatus && hasPaymentSource) {
              console.log(
                `ℹ️ Subscription period ended for ${updatedUser._id}, attempting Late Renewal before expiring...`
              );
              const renewed = await this.attemptRenewal(updatedUser);

              if (renewed) {
                continue; // Successfully renewed, do not expire!
              }
            }

            // If renewal failed or no card, THEN expire
            await this.expireSubscription(updatedUser);
            expired++;
          }
        } catch (error) {
          console.error(`Error processing expiry for user ${user._id}:`, error);
        }
      }

      return { processed, expired };
    } catch (error) {
      console.error("Error in processSubscriptionExpiries method:", error);
      throw error;
    }
  }

  /**
   * Expire subscription that has ended
   */
  async expireSubscription(user) {
    // Avoid double expiring
    if (user.subscription.status === "canceled") return;

    try {
      console.log(`⏰ Expiring subscription for user ${user._id}`);

      user.subscription.status = "canceled";
      await user.save();

      console.log(`✅ Subscription expired for user ${user._id}`);

      try {
        const plan = await this.planService.findPlanById(
          user.subscription.planId
        );
        await this.emailService.sendSubscriptionExpiredEmail(
          user,
          plan?.name || "Your subscription"
        );
      } catch (emailError) {
        console.error(
          `[Non-blocking] Failed to send expiry email:`,
          emailError
        );
      }
    } catch (error) {
      console.error(`Error expiring subscription:`, error);
    }
  }

  /**
   * Process and send expiry reminders
   * ✅ FIX: Added 24-hour reminder logic for short trials
   */
  async processExpiryReminders() {
    let processed = 0;
    let remindersSent = 0;

    try {
      const usersWithSubscriptions =
        await this.userService.findUsersWithSubscriptions();
      const now = new Date();

      // Time windows
      const sevenDaysFromNow = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      );
      const eightDaysFromNow = new Date(
        now.getTime() + 8 * 24 * 60 * 60 * 1000
      );

      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      console.log(
        `Checking ${usersWithSubscriptions.length} users for expiry reminders`
      );

      for (const user of usersWithSubscriptions) {
        try {
          processed++;

          // Skip if cancelled
          if (!user.subscription || user.subscription.status === "canceled")
            continue;
          if (!user.subscription.current_period_end) continue;

          const periodEnd = new Date(user.subscription.current_period_end);

          // Prevent spamming: Check if reminder sent recently (e.g. within last 20 hours)
          if (user.subscriptionExpiryReminderSent) {
            const lastSent = new Date(user.subscriptionExpiryReminderSent);
            const hoursSince = (now - lastSent) / (1000 * 60 * 60);
            if (hoursSince < 20) continue;
          }

          let shouldSend = false;

          // Check 7 Day Window
          if (periodEnd > sevenDaysFromNow && periodEnd <= eightDaysFromNow) {
            shouldSend = true;
          }
          // ✅ Check 1 Day Window (for trials or if 7-day missed)
          else if (periodEnd > now && periodEnd <= oneDayFromNow) {
            shouldSend = true;
          }

          if (shouldSend) {
            try {
              const plan = await this.planService.findPlanById(
                user.subscription.planId
              );

              await this.emailService.sendSubscriptionExpiryReminder(
                user,
                plan?.name || user.subscription.planName,
                periodEnd,
                user.getTotalDocumentsUsed(),
                user.getTotalDocumentLimit()
              );

              await this.userService.updateUser(user._id, {
                subscriptionExpiryReminderSent: now,
              });

              remindersSent++;
              console.log(
                `Sent expiry reminder to user ${user._id} for ${plan?.name}`
              );
            } catch (emailError) {
              console.error(
                `Failed to send expiry reminder to user ${user._id}:`,
                emailError
              );
            }
          }
        } catch (error) {
          console.error(
            `Error processing reminder for user ${user._id}:`,
            error
          );
        }
      }

      return { processed, remindersSent };
    } catch (error) {
      console.error("Error in processExpiryReminders method:", error);
      throw error;
    }
  }
}

module.exports = SubscriptionExpiryJob;
