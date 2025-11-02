const BaseJob = require("./BaseJob");

class ReminderJob extends BaseJob {
  constructor(container) {
    super(container);
    this.Package = container.resolve("Package");
    this.User = container.resolve("User");
    this.emailService = container.resolve("emailService");
    this.Contact = container.resolve("Contact");
  }

  /**
   * Run every 30 minutes
   */
  get schedule() {
    return "*/30 * * * *";
  }

  /**
   * Execute the reminder job
   */
  async execute() {
    const startTime = new Date();
    console.log(`Starting expiry reminder job at ${startTime.toISOString()}`);

    try {
      const remindersData = await this.sendExpiryReminders();

      this.updateLastRun();

      const endTime = new Date();
      const duration = endTime - startTime;

      console.log(
        `Reminder job completed in ${duration}ms. Sent ${remindersData.remindersSent} reminders.`
      );

      return remindersData;
    } catch (error) {
      console.error("Error in ReminderJob execution:", error);
      throw error;
    }
  }

  /**
   * Send reminder notifications before expiry
   */
  async sendExpiryReminders() {
    const now = new Date();
    let remindersSent = 0;
    let packagesProcessed = 0;

    try {
      // Find packages that need reminders
      const packagesNeedingReminders = await this.Package.find({
        "options.expiresAt": { $gt: now }, // Not yet expired
        "options.sendExpirationReminders": true,
        status: "Sent",
      }).populate("ownerId", "firstName lastName email");

      console.log(
        `Found ${packagesNeedingReminders.length} packages to check for reminders`
      );

      for (const pkg of packagesNeedingReminders) {
        try {
          packagesProcessed++;

          const timeUntilExpiry = pkg.options.expiresAt - now;
          const shouldSendReminder = this.shouldSendExpiryReminder(
            pkg.options.reminderPeriod,
            timeUntilExpiry
          );

          if (shouldSendReminder) {
            await this.sendReminderNotifications(pkg, timeUntilExpiry);
            remindersSent++;
            console.log(
              `Sent reminder for package: ${pkg.name} (ID: ${pkg._id})`
            );
          }
        } catch (error) {
          console.error(
            `Error processing reminder for package ${pkg._id}:`,
            error
          );
        }
      }

      return {
        packagesProcessed,
        remindersSent,
      };
    } catch (error) {
      console.error("Error in sendExpiryReminders method:", error);
      throw error;
    }
  }

  /**
   * Check if reminder should be sent based on period and time until expiry
   */
  shouldSendExpiryReminder(reminderPeriod, timeUntilExpiry) {
    const millisecondsInHour = 60 * 60 * 1000;
    const millisecondsInDay = 24 * millisecondsInHour;

    // Add tolerance of 30 minutes to catch reminders in the window
    const tolerance = 30 * 60 * 1000;

    switch (reminderPeriod) {
      case "1_hour_before":
        return (
          timeUntilExpiry <= millisecondsInHour + tolerance &&
          timeUntilExpiry > 0
        );
      case "2_hours_before":
        return (
          timeUntilExpiry <= 2 * millisecondsInHour + tolerance &&
          timeUntilExpiry > 0
        );
      case "1_day_before":
        return (
          timeUntilExpiry <= millisecondsInDay + tolerance &&
          timeUntilExpiry > 0
        );
      case "2_days_before":
        return (
          timeUntilExpiry <= 2 * millisecondsInDay + tolerance &&
          timeUntilExpiry > 0
        );
      default:
        return false;
    }
  }

  /**
   * Send reminder notifications
   */
  async sendReminderNotifications(pkg) {
    try {
      const owner = pkg.ownerId; // Assumes owner is populated
      const ownerName = `${owner.firstName} ${owner.lastName}`;

      const allRecipients = new Map();

      // 1. Gather all participants who have not completed their tasks
      pkg.fields.forEach((field) => {
        (field.assignedUsers || []).forEach((user) => {
          // Only send reminders to users who have not yet signed/completed
          if (!user.signed && !allRecipients.has(user.contactEmail)) {
            allRecipients.set(user.contactEmail, {
              contactId: user.contactId,
              participantId: user.id, // For the action link
              name: user.contactName,
              email: user.contactEmail,
            });
          }
        });
      });

      // 2. Efficiently fetch language preferences
      const contactIds = Array.from(allRecipients.values())
        .map((r) => r.contactId)
        .filter((id) => id);
      const contacts = await this.Contact.find({
        _id: { $in: contactIds },
      }).select("language");
      const languageMap = new Map(
        contacts.map((c) => [c._id.toString(), c.language])
      );

      // 3. Loop through recipients and send notifications
      for (const recipient of allRecipients.values()) {
        recipient.language =
          languageMap.get(recipient.contactId.toString()) || "en";

        // Fetch language-specific time units
        const content = getEmailContent("expiryReminder", recipient.language);
        const timeUnits = content.timeUnits;

        // Calculate human-readable time until expiry
        const timeUntilExpiry =
          pkg.options.expiresAt.getTime() - new Date().getTime();
        const hoursUntilExpiry = Math.ceil(timeUntilExpiry / (1000 * 60 * 60));
        const daysUntilExpiry = Math.ceil(
          timeUntilExpiry / (1000 * 60 * 60 * 24)
        );

        let timeString;
        if (hoursUntilExpiry <= 48) {
          timeString = `${hoursUntilExpiry} ${
            hoursUntilExpiry > 1 ? timeUnits.hours : timeUnits.hour
          }`;
        } else {
          timeString = `${daysUntilExpiry} ${
            daysUntilExpiry > 1 ? timeUnits.days : timeUnits.day
          }`;
        }

        // The action URL is specific to each participant
        const actionUrl = `${process.env.CLIENT_URL}/package/${pkg._id}/participant/${recipient.participantId}`;

        await this.emailService.sendExpiryReminderNotification(
          recipient, // Pass the entire enriched object
          ownerName,
          pkg.name,
          timeString,
          pkg.options.expiresAt,
          actionUrl
        );
      }
    } catch (error) {
      console.error(
        `Error sending reminder notifications for package ${pkg._id}:`,
        error
      );
    }
  }
}

module.exports = ReminderJob;
