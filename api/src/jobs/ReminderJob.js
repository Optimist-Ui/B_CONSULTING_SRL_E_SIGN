const BaseJob = require("./BaseJob");

class ReminderJob extends BaseJob {
  constructor(container) {
    super(container);
    this.Package = container.resolve("Package");
    this.User = container.resolve("User");
    this.emailService = container.resolve("emailService");
    this.Contact = container.resolve("Contact");
    this.pushNotificationService = container.resolve("pushNotificationService");
  }

  /**
   * Run every 15 minutes for better precision on hourly reminders
   */
  get schedule() {
    return process.env.REMINDER_CRON || "*/15 * * * *";
  }

  /**
   * Execute the reminder job
   */
  async execute() {
    const startTime = new Date();
    console.log(`Starting reminder job at ${startTime.toISOString()}`);

    try {
      // Run both expiry and automatic reminders
      const expiryData = await this.sendExpiryReminders();
      const automaticData = await this.sendAutomaticReminders();

      this.updateLastRun();

      const endTime = new Date();
      const duration = endTime - startTime;

      console.log(
        `Reminder job completed in ${duration}ms. ` +
          `Expiry reminders: ${expiryData.remindersSent}, ` +
          `Automatic reminders: ${automaticData.remindersSent}`
      );

      return {
        expiryReminders: expiryData,
        automaticReminders: automaticData,
      };
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
      // Find packages that need expiry reminders
      const packagesNeedingReminders = await this.Package.find({
        "options.expiresAt": { $gt: now }, // Not yet expired
        "options.sendExpirationReminders": true,
        "options.reminderPeriod": { $ne: null },
        "options.expiryReminderSentAt": { $exists: false }, // Not sent yet
        status: "Sent",
      }).populate("ownerId", "firstName lastName email");

      console.log(
        `Found ${packagesNeedingReminders.length} packages to check for expiry reminders`
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
            await this.sendExpiryReminderNotifications(pkg, timeUntilExpiry);

            // ✅ CRITICAL FIX: Mark reminder as sent
            pkg.options.expiryReminderSentAt = now;
            await pkg.save();

            remindersSent++;
            console.log(
              `✅ Sent expiry reminder for package: ${pkg.name} (ID: ${pkg._id})`
            );
          }
        } catch (error) {
          console.error(
            `❌ Error processing expiry reminder for package ${pkg._id}:`,
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
   * Send automatic recurring reminders after package is sent
   */
  async sendAutomaticReminders() {
    const now = new Date();
    let remindersSent = 0;
    let packagesProcessed = 0;

    try {
      // Find packages with automatic reminders enabled
      const packagesWithAutoReminders = await this.Package.find({
        "options.sendAutomaticReminders": true,
        "options.firstReminderDays": { $exists: true, $ne: null },
        sentAt: { $exists: true, $ne: null },
        status: "Sent", // Only sent packages
      }).populate("ownerId", "firstName lastName email");

      console.log(
        `Found ${packagesWithAutoReminders.length} packages to check for automatic reminders`
      );

      for (const pkg of packagesWithAutoReminders) {
        try {
          packagesProcessed++;

          // Check if package has expired
          if (pkg.options.expiresAt && now >= pkg.options.expiresAt) {
            console.log(`⏭️  Skipping expired package: ${pkg._id}`);
            continue;
          }

          // Calculate if reminder should be sent
          const shouldSend = this.shouldSendAutomaticReminder(pkg, now);

          if (shouldSend) {
            await this.sendAutomaticReminderNotifications(pkg);

            // Track that reminder was sent
            if (!pkg.options.automaticRemindersSent) {
              pkg.options.automaticRemindersSent = [];
            }

            // Count unsigned participants for tracking
            const unsignedCount = this.getUnsignedParticipantsCount(pkg);

            pkg.options.automaticRemindersSent.push({
              sentAt: now,
              recipientCount: unsignedCount,
            });

            await pkg.save();

            remindersSent++;
            console.log(
              `✅ Sent automatic reminder for package: ${pkg.name} (ID: ${pkg._id})`
            );
          }
        } catch (error) {
          console.error(
            `❌ Error processing automatic reminder for package ${pkg._id}:`,
            error
          );
        }
      }

      return {
        packagesProcessed,
        remindersSent,
      };
    } catch (error) {
      console.error("Error in sendAutomaticReminders method:", error);
      throw error;
    }
  }

  /**
   * Check if automatic reminder should be sent
   */
  shouldSendAutomaticReminder(pkg, now) {
    const sentAt = new Date(pkg.sentAt);
    const firstReminderDays = pkg.options.firstReminderDays;
    const repeatReminderDays = pkg.options.repeatReminderDays;
    const remindersSent = pkg.options.automaticRemindersSent || [];

    // Calculate milliseconds
    const daysSinceSent = (now - sentAt) / (1000 * 60 * 60 * 24);

    // Check if it's time for the first reminder
    if (remindersSent.length === 0) {
      // First reminder: send if enough days have passed
      // Add tolerance of 6 hours (0.25 days) since cron runs every 15 minutes
      return daysSinceSent >= firstReminderDays - 0.25;
    }

    // Check if repeat reminders are enabled
    if (!repeatReminderDays || repeatReminderDays <= 0) {
      return false; // No repeat reminders configured
    }

    // Get the last reminder sent time
    const lastReminder = remindersSent[remindersSent.length - 1];
    const lastReminderDate = new Date(lastReminder.sentAt);
    const daysSinceLastReminder =
      (now - lastReminderDate) / (1000 * 60 * 60 * 24);

    // Send repeat reminder if enough days have passed since last one
    // Add tolerance of 6 hours (0.25 days)
    return daysSinceLastReminder >= repeatReminderDays - 0.25;
  }

  /**
   * Get count of unsigned participants
   */
  getUnsignedParticipantsCount(pkg) {
    const unsignedParticipants = new Set();

    pkg.fields.forEach((field) => {
      (field.assignedUsers || []).forEach((user) => {
        if (!user.signed) {
          unsignedParticipants.add(user.contactEmail);
        }
      });
    });

    return unsignedParticipants.size;
  }

  /**
   * Check if expiry reminder should be sent based on period and time until expiry
   */
  shouldSendExpiryReminder(reminderPeriod, timeUntilExpiry) {
    const millisecondsInHour = 60 * 60 * 1000;
    const millisecondsInDay = 24 * millisecondsInHour;

    // Reduced tolerance to 15 minutes for better precision
    const tolerance = 15 * 60 * 1000;

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
   * Send expiry reminder notifications (only to unsigned participants)
   */
  async sendExpiryReminderNotifications(pkg) {
    try {
      const owner = pkg.ownerId;
      const ownerName = `${owner.firstName} ${owner.lastName}`;

      const allRecipients = new Map();

      // ✅ ONLY gather participants who have NOT completed their tasks
      pkg.fields.forEach((field) => {
        (field.assignedUsers || []).forEach((user) => {
          if (!user.signed && !allRecipients.has(user.contactEmail)) {
            allRecipients.set(user.contactEmail, {
              contactId: user.contactId,
              participantId: user.id,
              name: user.contactName,
              email: user.contactEmail,
            });
          }
        });
      });

      if (allRecipients.size === 0) {
        console.log(
          `ℹ️  No unsigned participants for package ${pkg._id}, skipping expiry reminder`
        );
        return;
      }

      // Fetch language preferences
      const contactIds = Array.from(allRecipients.values())
        .map((r) => r.contactId)
        .filter((id) => id);
      const contacts = await this.Contact.find({
        _id: { $in: contactIds },
      }).select("language");
      const languageMap = new Map(
        contacts.map((c) => [c._id.toString(), c.language])
      );

      // Calculate time until expiry
      const timeUntilExpiry =
        pkg.options.expiresAt.getTime() - new Date().getTime();
      const hoursUntilExpiry = Math.ceil(timeUntilExpiry / (1000 * 60 * 60));
      const daysUntilExpiry = Math.ceil(
        timeUntilExpiry / (1000 * 60 * 60 * 24)
      );

      // Send to each unsigned participant
      for (const recipient of allRecipients.values()) {
        try {
          recipient.language =
            languageMap.get(recipient.contactId.toString()) || "en";

          // Fetch language-specific time units
          const content = this.emailService.getEmailContent(
            "expiryReminder",
            recipient.language
          );
          const timeUnits = content.timeUnits;

          // Format time string
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

          const actionUrl = `${process.env.CLIENT_URL}/package/${pkg._id}/participant/${recipient.participantId}`;

          await this.emailService.sendExpiryReminderNotification(
            recipient,
            ownerName,
            pkg.name,
            timeString,
            pkg.options.expiresAt,
            actionUrl
          );

          // Send push notification
          if (this.pushNotificationService) {
            try {
              const user = await this.User.findOne({
                email: recipient.email.toLowerCase(),
              }).select("deviceTokens");

              if (user && user.deviceTokens && user.deviceTokens.length > 0) {
                const pushTitle = "Document Reminder";
                const pushBody = `${pkg.name} expires in ${timeString}`;
                await this.pushNotificationService.sendNotificationToUser(
                  user,
                  "document_reminder",
                  pkg._id.toString(),
                  pushTitle,
                  pushBody
                );
              }
            } catch (error) {
              console.error(
                `Error sending push notification to ${recipient.email}:`,
                error
              );
            }
          }
        } catch (error) {
          console.error(
            `Error sending expiry reminder to ${recipient.email}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error(
        `Error in sendExpiryReminderNotifications for package ${pkg._id}:`,
        error
      );
    }
  }

  /**
   * Send automatic reminder notifications (only to unsigned participants)
   * Reuses the manual reminder email template
   */
  async sendAutomaticReminderNotifications(pkg) {
    try {
      const owner = pkg.ownerId;
      const ownerName = `${owner.firstName} ${owner.lastName}`;

      const allRecipients = new Map();

      // ✅ ONLY gather participants who have NOT completed their tasks
      pkg.fields.forEach((field) => {
        (field.assignedUsers || []).forEach((user) => {
          if (!user.signed && !allRecipients.has(user.contactEmail)) {
            allRecipients.set(user.contactEmail, {
              contactId: user.contactId,
              participantId: user.id,
              name: user.contactName,
              email: user.contactEmail,
            });
          }
        });
      });

      if (allRecipients.size === 0) {
        console.log(
          `ℹ️  No unsigned participants for package ${pkg._id}, skipping automatic reminder`
        );
        return;
      }

      // Fetch language preferences
      const contactIds = Array.from(allRecipients.values())
        .map((r) => r.contactId)
        .filter((id) => id);
      const contacts = await this.Contact.find({
        _id: { $in: contactIds },
      }).select("language");
      const languageMap = new Map(
        contacts.map((c) => [c._id.toString(), c.language])
      );

      // Send to each unsigned participant
      for (const recipient of allRecipients.values()) {
        try {
          recipient.language =
            languageMap.get(recipient.contactId.toString()) || "en";

          const actionUrl = `${process.env.CLIENT_URL}/package/${pkg._id}/participant/${recipient.participantId}`;

          // ✅ Reuse manual reminder method (as requested)
          await this.emailService.sendManualReminderNotification(
            {
              contactEmail: recipient.email,
              contactName: recipient.name,
              language: recipient.language,
            },
            ownerName,
            pkg.name,
            actionUrl
          );

          // Send push notification
          if (this.pushNotificationService) {
            try {
              const user = await this.User.findOne({
                email: recipient.email.toLowerCase(),
              }).select("deviceTokens");

              if (user && user.deviceTokens && user.deviceTokens.length > 0) {
                const pushTitle = "Action Required";
                const pushBody = `Reminder: Please complete ${pkg.name}`;
                await this.pushNotificationService.sendNotificationToUser(
                  user,
                  "document_reminder",
                  pkg._id.toString(),
                  pushTitle,
                  pushBody
                );
              }
            } catch (error) {
              console.error(
                `Error sending push notification to ${recipient.email}:`,
                error
              );
            }
          }
        } catch (error) {
          console.error(
            `Error sending automatic reminder to ${recipient.email}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error(
        `Error in sendAutomaticReminderNotifications for package ${pkg._id}:`,
        error
      );
    }
  }
}

module.exports = ReminderJob;
