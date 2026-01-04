const BaseJob = require("./BaseJob");

class CardVerificationReminderJob extends BaseJob {
  constructor(container) {
    super(container);
    this.User = container.resolve("User");
    this.emailService = container.resolve("emailService");
    this.pushNotificationService = container.resolve("pushNotificationService");
  }

  /**
   * Run every 30 minutes for better precision
   */
  get schedule() {
    return process.env.CARD_VERIFICATION_REMINDER_CRON || "*/30 * * * *";
  }

  /**
   * Execute the card verification reminder job
   */
  async execute() {
    const startTime = new Date();
    console.log(
      `🔔 Starting card verification reminder job at ${startTime.toISOString()}`
    );

    try {
      const oneHourResult = await this.sendOneHourReminders();
      const twentyFourHourResult = await this.sendTwentyFourHourReminders();

      this.updateLastRun();

      const endTime = new Date();
      const duration = endTime - startTime;

      console.log(
        `✅ Card verification reminder job completed in ${duration}ms\n` +
          `   1-hour reminders: ${oneHourResult.remindersSent}/${oneHourResult.usersProcessed}\n` +
          `   24-hour reminders: ${twentyFourHourResult.remindersSent}/${twentyFourHourResult.usersProcessed}`
      );

      return {
        oneHourReminders: oneHourResult,
        twentyFourHourReminders: twentyFourHourResult,
        duration,
      };
    } catch (error) {
      console.error(
        "❌ Error in CardVerificationReminderJob execution:",
        error
      );
      throw error;
    }
  }

  /**
   * Send reminders 1 hour after signup
   */
  async sendOneHourReminders() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneHourAgoWithTolerance = new Date(
      now.getTime() - 60 * 60 * 1000 - 15 * 60 * 1000
    ); // 15 min tolerance

    let remindersSent = 0;
    let usersProcessed = 0;
    const errors = [];

    try {
      // Find users who:
      // 1. Created account ~1 hour ago
      // 2. Are verified (email)
      // 3. Don't have payment sources
      // 4. Haven't received 1-hour reminder yet
      const users = await this.User.find({
        isVerified: true,
        createdAt: {
          $gte: oneHourAgoWithTolerance,
          $lte: oneHourAgo,
        },
        $or: [
          { vivaWalletPaymentSources: { $exists: false } },
          { vivaWalletPaymentSources: { $size: 0 } },
        ],
        cardVerificationReminder1hSentAt: { $exists: false },
      }).select("firstName lastName email language deviceTokens");

      console.log(
        `📋 Found ${users.length} users for 1-hour card verification reminder`
      );

      for (const user of users) {
        try {
          usersProcessed++;

          // ✅ Atomic update to prevent duplicate sends
          const updated = await this.User.findOneAndUpdate(
            {
              _id: user._id,
              cardVerificationReminder1hSentAt: { $exists: false },
            },
            {
              $set: { cardVerificationReminder1hSentAt: now },
            },
            { new: true }
          );

          if (!updated) {
            console.log(
              `⏭️  1-hour reminder already sent for user: ${user.email}`
            );
            continue;
          }

          // Send email
          await this.emailService.sendCardVerificationReminder(user, "1_hour");

          // Send push notification
          if (this.pushNotificationService && user.deviceTokens?.length > 0) {
            try {
              await this.pushNotificationService.sendNotificationToUser(
                user,
                "card_verification_reminder",
                null,
                "Complete Your Setup",
                "Verify your card to start your 14-day free trial!"
              );
            } catch (error) {
              console.error(
                `⚠️  Push notification failed for ${user.email}:`,
                error.message
              );
            }
          }

          remindersSent++;
          console.log(
            `✅ Sent 1-hour card verification reminder to: ${user.email}`
          );
        } catch (error) {
          console.error(
            `❌ Error sending 1-hour reminder to ${user.email}:`,
            error
          );
          errors.push({
            userId: user._id,
            email: user.email,
            type: "1_hour",
            error: error.message,
          });
        }
      }

      return {
        usersProcessed,
        remindersSent,
        errors,
      };
    } catch (error) {
      console.error("❌ Error in sendOneHourReminders method:", error);
      throw error;
    }
  }

  /**
   * Send reminders 24 hours after signup
   */
  async sendTwentyFourHourReminders() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twentyFourHoursAgoWithTolerance = new Date(
      now.getTime() - 24 * 60 * 60 * 1000 - 30 * 60 * 1000
    ); // 30 min tolerance

    let remindersSent = 0;
    let usersProcessed = 0;
    const errors = [];

    try {
      // Find users who:
      // 1. Created account ~24 hours ago
      // 2. Are verified (email)
      // 3. Don't have payment sources
      // 4. Haven't received 24-hour reminder yet
      const users = await this.User.find({
        isVerified: true,
        createdAt: {
          $gte: twentyFourHoursAgoWithTolerance,
          $lte: twentyFourHoursAgo,
        },
        $or: [
          { vivaWalletPaymentSources: { $exists: false } },
          { vivaWalletPaymentSources: { $size: 0 } },
        ],
        cardVerificationReminder24hSentAt: { $exists: false },
      }).select("firstName lastName email language deviceTokens");

      console.log(
        `📋 Found ${users.length} users for 24-hour card verification reminder`
      );

      for (const user of users) {
        try {
          usersProcessed++;

          // ✅ Atomic update to prevent duplicate sends
          const updated = await this.User.findOneAndUpdate(
            {
              _id: user._id,
              cardVerificationReminder24hSentAt: { $exists: false },
            },
            {
              $set: { cardVerificationReminder24hSentAt: now },
            },
            { new: true }
          );

          if (!updated) {
            console.log(
              `⏭️  24-hour reminder already sent for user: ${user.email}`
            );
            continue;
          }

          // Send email
          await this.emailService.sendCardVerificationReminder(
            user,
            "24_hours"
          );

          // Send push notification
          if (this.pushNotificationService && user.deviceTokens?.length > 0) {
            try {
              await this.pushNotificationService.sendNotificationToUser(
                user,
                "card_verification_reminder",
                null,
                "Don't Miss Out!",
                "Verify your card now to unlock your 14-day free trial"
              );
            } catch (error) {
              console.error(
                `⚠️  Push notification failed for ${user.email}:`,
                error.message
              );
            }
          }

          remindersSent++;
          console.log(
            `✅ Sent 24-hour card verification reminder to: ${user.email}`
          );
        } catch (error) {
          console.error(
            `❌ Error sending 24-hour reminder to ${user.email}:`,
            error
          );
          errors.push({
            userId: user._id,
            email: user.email,
            type: "24_hours",
            error: error.message,
          });
        }
      }

      return {
        usersProcessed,
        remindersSent,
        errors,
      };
    } catch (error) {
      console.error("❌ Error in sendTwentyFourHourReminders method:", error);
      throw error;
    }
  }
}

module.exports = CardVerificationReminderJob;
