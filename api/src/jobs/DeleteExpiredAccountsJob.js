const BaseJob = require("./BaseJob");

class DeleteExpiredAccountsJob extends BaseJob {
  constructor(container) {
    super(container);
    this.userService = container.resolve("userService");
    this.stripe = container.resolve("stripe");
    this.User = container.resolve("User");
  }

  get schedule() {
    return "0 0 * * *"; // Daily at midnight
  }

  async execute() {
    const now = new Date();
    const expiredUsers = await this.User.find({
      isDeactivated: true,
      deletionScheduledAt: { $lt: now },
    });

    console.log(`Found ${expiredUsers.length} accounts scheduled for deletion`);

    for (const user of expiredUsers) {
      try {
        // Cancel subscription if it still exists
        if (user.subscription && user.subscription.subscriptionId) {
          try {
            await this.stripe.subscriptions.cancel(
              user.subscription.subscriptionId
            );
            console.log(
              `Cancelled subscription ${user.subscription.subscriptionId} for user ${user._id}`
            );
          } catch (stripeError) {
            console.error(
              `Failed to cancel subscription for user ${user._id}:`,
              stripeError.message
            );
            // Continue with deletion even if cancellation fails
          }
        }

        // Hard delete the user
        await user.deleteOne();
        console.log(`Deleted user account: ${user._id} (${user.email})`);

        // Optional: Handle orphaned documents
        // await this.Document.updateMany({ owner: user._id }, { owner: null });
      } catch (error) {
        console.error(`Failed to delete user ${user._id}:`, error);
      }
    }

    console.log(
      `Account deletion job completed. Processed ${expiredUsers.length} accounts.`
    );
  }
}

module.exports = DeleteExpiredAccountsJob;
