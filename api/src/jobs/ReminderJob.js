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
   * Run every 15 minutes for better precision
   * ✅ FIXED: Validate cron expression to prevent crashes
   */
  get schedule() {
    const defaultSchedule = "*/15 * * * *";
    const envSchedule = process.env.REMINDER_CRON;

    // If env variable is set, validate it
    if (envSchedule) {
      try {
        // Basic cron validation
        const parts = envSchedule.trim().split(/\s+/);
        if (parts.length === 5) {
          console.log(`✅ Using custom reminder schedule: ${envSchedule}`);
          return envSchedule;
        } else {
          console.warn(
            `⚠️  Invalid REMINDER_CRON format: "${envSchedule}". Using default: ${defaultSchedule}`
          );
        }
      } catch (error) {
        console.warn(
          `⚠️  Error parsing REMINDER_CRON: ${error.message}. Using default: ${defaultSchedule}`
        );
      }
    }

    return defaultSchedule;
  }

  /**
   * Execute the reminder job
   */
  async execute() {
    const startTime = new Date();
    console.log(`🔔 Starting reminder job at ${startTime.toISOString()}`);

    try {
      // Run both expiry and automatic reminders
      const expiryData = await this.sendExpiryReminders();
      const automaticData = await this.sendAutomaticReminders();

      this.updateLastRun();

      const endTime = new Date();
      const duration = endTime - startTime;

      console.log(
        `✅ Reminder job completed in ${duration}ms\n` +
          `   Expiry reminders: ${expiryData.remindersSent}/${expiryData.packagesProcessed}\n` +
          `   Automatic reminders: ${automaticData.remindersSent}/${automaticData.packagesProcessed}`
      );

      return {
        expiryReminders: expiryData,
        automaticReminders: automaticData,
        duration,
      };
    } catch (error) {
      console.error("❌ Error in ReminderJob execution:", error);
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
    const errors = [];

    try {
      // Find packages that need expiry reminders
      const packagesNeedingReminders = await this.Package.find({
        "options.expiresAt": { $gt: now }, // Not yet expired
        "options.sendExpirationReminders": true,
        "options.reminderPeriod": { $ne: null },
        "options.expiryReminderSentAt": { $exists: false }, // Not sent yet
        status: "Sent",
      }).populate("ownerId", "firstName lastName email language");

      console.log(
        `📋 Found ${packagesNeedingReminders.length} packages to check for expiry reminders`
      );

      for (const pkg of packagesNeedingReminders) {
        try {
          packagesProcessed++;

          const timeUntilExpiry =
            pkg.options.expiresAt.getTime() - now.getTime();
          const shouldSendReminder = this.shouldSendExpiryReminder(
            pkg.options.reminderPeriod,
            timeUntilExpiry
          );

          if (shouldSendReminder) {
            // ✅ Use atomic update to prevent duplicate sends
            const updated = await this.Package.findOneAndUpdate(
              {
                _id: pkg._id,
                "options.expiryReminderSentAt": { $exists: false },
              },
              {
                $set: { "options.expiryReminderSentAt": now },
              },
              { new: true }
            ).populate("ownerId", "firstName lastName email language");

            // If update failed, another process already sent it
            if (!updated) {
              console.log(
                `⏭️  Expiry reminder already sent for package: ${pkg.name} (ID: ${pkg._id})`
              );
              continue;
            }

            await this.sendExpiryReminderNotifications(updated);
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
          errors.push({
            packageId: pkg._id,
            type: "expiry",
            error: error.message,
          });
        }
      }

      return {
        packagesProcessed,
        remindersSent,
        errors,
      };
    } catch (error) {
      console.error("❌ Error in sendExpiryReminders method:", error);
      throw error;
    }
  }

  /**
   * Send automatic recurring reminders after package is sent
   * ✅ THIS IS YOUR 24H REMINDER SYSTEM
   */
  async sendAutomaticReminders() {
    const now = new Date();
    let remindersSent = 0;
    let packagesProcessed = 0;
    const errors = [];

    try {
      // Find packages with automatic reminders enabled
      const packagesWithAutoReminders = await this.Package.find({
        "options.sendAutomaticReminders": true,
        "options.firstReminderDays": { $exists: true, $ne: null },
        $or: [
          { sentAt: { $exists: true, $ne: null } },
          { status: "Sent", createdAt: { $exists: true } },
        ],
        status: "Sent", // Only sent packages
        $or: [
          { "options.expiresAt": { $exists: false } }, // No expiry
          { "options.expiresAt": null }, // No expiry
          { "options.expiresAt": { $gt: now } }, // Not expired yet
        ],
      }).populate("ownerId", "firstName lastName email language");

      console.log(
        `📋 Found ${packagesWithAutoReminders.length} packages to check for automatic reminders`
      );

      for (const pkg of packagesWithAutoReminders) {
        try {
          packagesProcessed++;

          // Check if all tasks are completed
          if (this.areAllTasksCompleted(pkg)) {
            console.log(
              `⏭️  All tasks completed for package ${pkg._id}, skipping reminder`
            );
            continue;
          }

          // Calculate if reminder should be sent
          const shouldSend = this.shouldSendAutomaticReminder(pkg, now);

          if (shouldSend) {
            // ✅ Use atomic update to add reminder to history
            const updated = await this.Package.findOneAndUpdate(
              {
                _id: pkg._id,
                status: "Sent", // Ensure still active
              },
              {
                $push: {
                  "options.automaticRemindersSent": {
                    sentAt: now,
                    recipientCount: this.getUnsignedParticipantsCount(pkg),
                  },
                },
              },
              { new: true }
            ).populate("ownerId", "firstName lastName email language");

            if (!updated) {
              console.log(
                `⏭️  Package status changed, skipping: ${pkg.name} (ID: ${pkg._id})`
              );
              continue;
            }

            await this.sendAutomaticReminderNotifications(updated);
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
          errors.push({
            packageId: pkg._id,
            type: "automatic",
            error: error.message,
          });
        }
      }

      return {
        packagesProcessed,
        remindersSent,
        errors,
      };
    } catch (error) {
      console.error("❌ Error in sendAutomaticReminders method:", error);
      throw error;
    }
  }

  /**
   * Check if automatic reminder should be sent
   * ✅ THIS DETERMINES WHEN 24H REMINDERS FIRE
   */
  shouldSendAutomaticReminder(pkg, now) {
    const firstReminderDays = pkg.options.firstReminderDays;
    const repeatReminderDays = pkg.options.repeatReminderDays;
    const remindersSent = pkg.options.automaticRemindersSent || [];

    // Calculate days since sent
    const sentAt = new Date(pkg.sentAt || pkg.createdAt); // ✅ Fallback
    const daysSinceSent = (now - sentAt) / (1000 * 60 * 60 * 24);

    // ✅ First reminder: send if enough days have passed
    if (remindersSent.length === 0) {
      // Tolerance of 6 hours (0.25 days) to catch reminders in the window
      const shouldSend = daysSinceSent >= firstReminderDays - 0.25;

      if (shouldSend) {
        console.log(
          `📅 Package ${pkg._id}: Sending first automatic reminder\n` +
            `   Days since sent: ${daysSinceSent.toFixed(2)}\n` +
            `   First reminder threshold: ${firstReminderDays}`
        );
      }

      return shouldSend;
    }

    // ✅ Repeat reminders
    if (!repeatReminderDays || repeatReminderDays <= 0) {
      return false; // No repeat reminders configured
    }

    const lastReminder = remindersSent[remindersSent.length - 1];
    const lastReminderDate = new Date(lastReminder.sentAt);
    const daysSinceLastReminder =
      (now - lastReminderDate) / (1000 * 60 * 60 * 24);

    // Tolerance of 6 hours (0.25 days)
    const shouldSend = daysSinceLastReminder >= repeatReminderDays - 0.25;

    if (shouldSend) {
      console.log(
        `📅 Package ${pkg._id}: Sending repeat automatic reminder\n` +
          `   Days since last reminder: ${daysSinceLastReminder.toFixed(2)}\n` +
          `   Repeat interval: ${repeatReminderDays}`
      );
    }

    return shouldSend;
  }

  /**
   * Check if all tasks are completed
   */
  areAllTasksCompleted(pkg) {
    for (const field of pkg.fields) {
      for (const user of field.assignedUsers || []) {
        if (!user.signed) {
          return false;
        }
      }
    }
    return true;
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
   * Check if expiry reminder should be sent
   */
  shouldSendExpiryReminder(reminderPeriod, timeUntilExpiry) {
    const HOUR = 60 * 60 * 1000;
    const DAY = 24 * HOUR;

    // 15-minute tolerance (matches cron frequency)
    const TOLERANCE = 15 * 60 * 1000;

    // Must be positive time remaining
    if (timeUntilExpiry <= 0) return false;

    switch (reminderPeriod) {
      case "1_hour_before":
        return (
          timeUntilExpiry <= HOUR + TOLERANCE &&
          timeUntilExpiry > HOUR - TOLERANCE
        );
      case "2_hours_before":
        return (
          timeUntilExpiry <= 2 * HOUR + TOLERANCE &&
          timeUntilExpiry > 2 * HOUR - TOLERANCE
        );
      case "1_day_before":
        return (
          timeUntilExpiry <= DAY + TOLERANCE &&
          timeUntilExpiry > DAY - TOLERANCE
        );
      case "2_days_before":
        return (
          timeUntilExpiry <= 2 * DAY + TOLERANCE &&
          timeUntilExpiry > 2 * DAY - TOLERANCE
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
            languageMap.get(recipient.contactId?.toString()) || "en";

          // Fetch language-specific time units
          const content = this.emailService.getEmailContent(
            "expiryReminder",
            recipient.language
          );
          const timeUnits = content?.timeUnits || {
            hour: "hour",
            hours: "hours",
            day: "day",
            days: "days",
          };

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

              if (user?.deviceTokens?.length > 0) {
                await this.pushNotificationService.sendNotificationToUser(
                  user,
                  "document_reminder",
                  pkg._id.toString(),
                  "Document Reminder",
                  `${pkg.name} expires in ${timeString}`
                );
              }
            } catch (error) {
              console.error(
                `⚠️  Push notification failed for ${recipient.email}:`,
                error.message
              );
            }
          }
        } catch (error) {
          console.error(
            `❌ Error sending expiry reminder to ${recipient.email}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error(
        `❌ Error in sendExpiryReminderNotifications for package ${pkg._id}:`,
        error
      );
    }
  }

  /**
   * Send automatic reminder notifications (only to unsigned participants)
   * ✅ THIS SENDS THE 24H REMINDER EMAILS
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

      console.log(
        `📧 Sending automatic reminder to ${allRecipients.size} unsigned participants for package ${pkg._id}`
      );

      // Send to each unsigned participant
      for (const recipient of allRecipients.values()) {
        try {
          recipient.language =
            languageMap.get(recipient.contactId?.toString()) || "en";

          const actionUrl = `${process.env.CLIENT_URL}/package/${pkg._id}/participant/${recipient.participantId}`;

          // ✅ Reuse manual reminder method
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

              if (user?.deviceTokens?.length > 0) {
                await this.pushNotificationService.sendNotificationToUser(
                  user,
                  "document_reminder",
                  pkg._id.toString(),
                  "Action Required",
                  `Reminder: Please complete ${pkg.name}`
                );
              }
            } catch (error) {
              console.error(
                `⚠️  Push notification failed for ${recipient.email}:`,
                error.message
              );
            }
          }
        } catch (error) {
          console.error(
            `❌ Error sending automatic reminder to ${recipient.email}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error(
        `❌ Error in sendAutomaticReminderNotifications for package ${pkg._id}:`,
        error
      );
    }
  }
}

module.exports = ReminderJob;
