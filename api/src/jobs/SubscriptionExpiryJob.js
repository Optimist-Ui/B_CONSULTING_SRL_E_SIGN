// src/jobs/SubscriptionExpiryJob.js - FIXED BILLING INTERVAL BUG

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
      const usersNeedingRenewal = await this.User.find({
        "subscription.status": "active",
        "subscription.current_period_end": {
          $lte: threeDaysFromNow,
          $gt: now,
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
        await this.markSubscriptionAsPastDue(user);
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

      // ✅ FIX: Use billing interval from user's subscription
      const billingInterval = user.subscription.billingInterval || "month";
      const isYearly = billingInterval === "year";
      const amount = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

      console.log(`💳 Processing renewal payment for user ${user._id}...`);
      console.log(`   Billing: ${billingInterval}, Amount: €${amount / 100}`);
      console.log(`   Payment Source: ${defaultSource.transactionId}`);

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
        console.error(`   Status: ${paymentResponse.data.StatusId}`);
        console.error(`   Error: ${paymentResponse.data.ErrorText}`);
        await this.markSubscriptionAsPastDue(user);
        return false;
      }

      const newTransactionId = paymentResponse.data.TransactionId;
      console.log(`✅ Renewal payment successful: ${newTransactionId}`);

      // ✅ FIX: Calculate new period based on billing interval
      const now = new Date();
      const newPeriodEnd = new Date(user.subscription.current_period_end);

      if (isYearly) {
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
      } else {
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      }

      // Update subscription history
      user.subscriptionHistory.forEach((entry) => {
        if (entry.status === "active") {
          entry.status = "expired";
          entry.endDate = now;
        }
      });

      // Add new period
      user.subscriptionHistory.push({
        type: "paid",
        planId: plan._id,
        planName: plan.name,
        startDate: now,
        endDate: newPeriodEnd,
        documentLimit: plan.documentLimit,
        documentsUsed: 0,
        status: "active",
      });

      // Update subscription
      user.subscription.subscriptionId = newTransactionId;
      user.subscription.current_period_start = now;
      user.subscription.current_period_end = newPeriodEnd;
      user.subscription.status = "active";
      user.subscription.billingInterval = billingInterval; // ✅ Preserve billing interval

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

      // Send payment failed email
      try {
        const plan = await this.planService.findPlanById(
          user.subscription.planId
        );

        // ✅ FIX: Use billing interval to determine amount
        const billingInterval = user.subscription.billingInterval || "month";
        const isYearly = billingInterval === "year";
        const amount = plan
          ? (isYearly ? plan.yearlyPrice : plan.monthlyPrice) / 100
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

          // Handle expiry
          await this.vivaWalletSubscriptionService.handleSubscriptionExpiry(
            user._id
          );

          // Refresh user to check changes
          const updatedUser = await this.userService.findUserById(user._id);
          const updatedHistory = updatedUser.subscriptionHistory || [];
          const updatedExpired = updatedHistory.filter(
            (h) => h.status === "expired"
          ).length;

          const newlyExpired = updatedExpired - originalExpired;
          if (newlyExpired > 0) {
            expired += newlyExpired;
            console.log(
              `Expired ${newlyExpired} history entries for user ${user._id}`
            );

            // Check if subscription itself has expired
            if (
              updatedUser.subscription &&
              updatedUser.subscription.current_period_end &&
              new Date(updatedUser.subscription.current_period_end) < new Date()
            ) {
              await this.expireSubscription(updatedUser);
            }
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
    try {
      console.log(`⏰ Expiring subscription for user ${user._id}`);

      // Mark subscription as canceled
      user.subscription.status = "canceled";
      await user.save();

      console.log(`✅ Subscription expired for user ${user._id}`);

      // Send expiry email
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
   * Process and send expiry reminders (7 days before)
   */
  async processExpiryReminders() {
    let processed = 0;
    let remindersSent = 0;

    try {
      const usersWithSubscriptions =
        await this.userService.findUsersWithSubscriptions();
      const now = new Date();
      const sevenDaysFromNow = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      );
      const eightDaysFromNow = new Date(
        now.getTime() + 8 * 24 * 60 * 60 * 1000
      );

      console.log(
        `Checking ${usersWithSubscriptions.length} users for expiry reminders`
      );

      for (const user of usersWithSubscriptions) {
        try {
          processed++;

          // Skip if reminder already sent recently (within last 6 days)
          if (user.subscriptionExpiryReminderSent) {
            const timeSinceReminder =
              now - new Date(user.subscriptionExpiryReminderSent);
            const daysSinceReminder = timeSinceReminder / (1000 * 60 * 60 * 24);
            if (daysSinceReminder < 6) {
              continue;
            }
          }

          // Check subscription period end (for active subscriptions)
          if (
            user.subscription &&
            user.subscription.status === "active" &&
            user.subscription.current_period_end
          ) {
            const periodEnd = new Date(user.subscription.current_period_end);

            // Check if expiry is between 7 and 8 days from now
            if (periodEnd > sevenDaysFromNow && periodEnd <= eightDaysFromNow) {
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

                // Update reminder sent timestamp
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
