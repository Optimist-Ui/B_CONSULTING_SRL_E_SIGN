const BaseJob = require("./BaseJob");

class SubscriptionExpiryJob extends BaseJob {
  constructor(container) {
    super(container);
    this.subscriptionService = container.resolve("subscriptionService");
    this.userService = container.resolve("userService");
  }

  /**
   * Run every hour at minute 0
   */
  get schedule() {
    return "0 * * * *";
  }

  /**
   * Execute the subscription expiry job
   */
  async execute() {
    const startTime = new Date();
    console.log(`Starting subscription expiry job at ${startTime.toISOString()}`);

    try {
      const expiredSubscriptions = await this.processSubscriptionExpiries();

      this.updateLastRun();

      const endTime = new Date();
      const duration = endTime - startTime;

      console.log(
        `Subscription expiry job completed in ${duration}ms. Processed ${expiredSubscriptions.processed} users, expired ${expiredSubscriptions.expired} entries.`
      );

      return expiredSubscriptions;
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
      // Find all users with subscriptions
      const usersWithSubscriptions = await this.userService.findUsersWithSubscriptions();

      console.log(`Found ${usersWithSubscriptions.length} users with subscriptions to check`);

      for (const user of usersWithSubscriptions) {
        try {
          processed++;
          
          // Get current history count
          const originalHistory = user.subscriptionHistory || [];
          const originalExpired = originalHistory.filter(h => h.status === 'expired').length;

          // Handle expiry
          await this.subscriptionService.handleSubscriptionExpiry(user._id);

          // Refresh user to check changes
          const updatedUser = await this.userService.findUserById(user._id);
          const updatedHistory = updatedUser.subscriptionHistory || [];
          const updatedExpired = updatedHistory.filter(h => h.status === 'expired').length;

          const newlyExpired = updatedExpired - originalExpired;
          if (newlyExpired > 0) {
            expired += newlyExpired;
            console.log(`Expired ${newlyExpired} history entries for user ${user._id}`);
          }

        } catch (error) {
          console.error(`Error processing expiry for user ${user._id}:`, error);
        }
      }

      return {
        processed,
        expired
      };

    } catch (error) {
      console.error("Error in processSubscriptionExpiries method:", error);
      throw error;
    }
  }
}

module.exports = SubscriptionExpiryJob;