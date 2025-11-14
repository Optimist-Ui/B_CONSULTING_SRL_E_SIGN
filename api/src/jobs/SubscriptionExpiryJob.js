const BaseJob = require("./BaseJob");

class SubscriptionExpiryJob extends BaseJob {
  constructor(container) {
    super(container);
    this.subscriptionService = container.resolve("subscriptionService");
    this.userService = container.resolve("userService");
    this.emailService = container.resolve("emailService");
  }

  /**
   * Run every hour at minute 0
   */
  get schedule() {
    return "* * * * *";
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
        this.processSubscriptionExpiries(),
        this.processExpiryReminders(),
      ]);

      this.updateLastRun();

      const endTime = new Date();
      const duration = endTime - startTime;

      console.log(
        `Subscription expiry job completed in ${duration}ms. ` +
          `Expired: ${results[0].expired} entries, ` +
          `Reminders sent: ${results[1].remindersSent}`
      );

      return {
        expiries: results[0],
        reminders: results[1],
      };
    } catch (error) {
      console.error("Error in SubscriptionExpiryJob execution:", error);
      throw error;
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
          await this.subscriptionService.handleSubscriptionExpiry(user._id);

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

            // Send expiry notification email
            await this.sendExpiryNotification(updatedUser, updatedHistory);
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
   * Process and send expiry reminders (1 day before)
   */
  async processExpiryReminders() {
    let processed = 0;
    let remindersSent = 0;

    try {
      const usersWithSubscriptions =
        await this.userService.findUsersWithSubscriptions();
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      console.log(
        `Checking ${usersWithSubscriptions.length} users for expiry reminders`
      );

      for (const user of usersWithSubscriptions) {
        try {
          processed++;

          // Skip if reminder already sent recently (within last 36 hours)
          if (user.subscriptionExpiryReminderSent) {
            const timeSinceReminder =
              now - new Date(user.subscriptionExpiryReminderSent);
            const hoursSinceReminder = timeSinceReminder / (1000 * 60 * 60);
            if (hoursSinceReminder < 36) {
              continue; // Skip this user
            }
          }

          // Check for active subscriptions expiring in ~24 hours
          const activeHistory = (user.subscriptionHistory || []).filter(
            (h) => h.status === "active" && h.endDate
          );

          for (const entry of activeHistory) {
            const endDate = new Date(entry.endDate);

            // Check if expiry is between 24 and 48 hours from now
            if (endDate > tomorrow && endDate <= dayAfterTomorrow) {
              try {
                await this.emailService.sendSubscriptionExpiryReminder(
                  user,
                  entry.planName,
                  endDate,
                  entry.documentsUsed || 0,
                  entry.documentLimit || 0
                );

                // Update reminder sent timestamp
                await this.userService.updateUser(user._id, {
                  subscriptionExpiryReminderSent: now,
                });

                remindersSent++;
                console.log(
                  `Sent expiry reminder to user ${user._id} for plan ${entry.planName}`
                );
                break; // Only send one reminder per user per run
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

  /**
   * Send expiry notification email for newly expired subscriptions
   */
  async sendExpiryNotification(user, subscriptionHistory) {
    try {
      // Find the most recently expired entry
      const expiredEntries = subscriptionHistory
        .filter((h) => h.status === "expired")
        .sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

      if (expiredEntries.length === 0) return;

      const latestExpired = expiredEntries[0];

      await this.emailService.sendSubscriptionExpiredEmail(
        user,
        latestExpired.planName,
        new Date(latestExpired.endDate),
        latestExpired.documentsUsed || 0,
        latestExpired.documentLimit || 0
      );

      console.log(`Sent expiry notification to user ${user._id}`);
    } catch (error) {
      console.error(
        `Failed to send expiry notification to user ${user._id}:`,
        error
      );
    }
  }
}

module.exports = SubscriptionExpiryJob;
