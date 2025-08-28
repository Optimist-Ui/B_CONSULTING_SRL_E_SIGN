const BaseJob = require('./BaseJob');

class ReminderJob extends BaseJob {
  constructor(container) {
    super(container);
    this.Package = container.resolve('Package');
    this.User = container.resolve('User');
    this.emailService = container.resolve('emailService');
  }

  /**
   * Run every 30 minutes
   */
  get schedule() {
    return '*/30 * * * *';
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
      
      console.log(`Reminder job completed in ${duration}ms. Sent ${remindersData.remindersSent} reminders.`);
      
      return remindersData;
    } catch (error) {
      console.error('Error in ReminderJob execution:', error);
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
        'options.expiresAt': { $gt: now }, // Not yet expired
        'options.sendExpirationReminders': true,
        status: 'Sent'
      }).populate('ownerId', 'firstName lastName email');

      console.log(`Found ${packagesNeedingReminders.length} packages to check for reminders`);

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
            console.log(`Sent reminder for package: ${pkg.name} (ID: ${pkg._id})`);
          }
        } catch (error) {
          console.error(`Error processing reminder for package ${pkg._id}:`, error);
        }
      }

      return {
        packagesProcessed,
        remindersSent
      };

    } catch (error) {
      console.error('Error in sendExpiryReminders method:', error);
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
      case '1_hour_before':
        return timeUntilExpiry <= (millisecondsInHour + tolerance) && timeUntilExpiry > 0;
      case '2_hours_before':
        return timeUntilExpiry <= (2 * millisecondsInHour + tolerance) && timeUntilExpiry > 0;
      case '1_day_before':
        return timeUntilExpiry <= (millisecondsInDay + tolerance) && timeUntilExpiry > 0;
      case '2_days_before':
        return timeUntilExpiry <= (2 * millisecondsInDay + tolerance) && timeUntilExpiry > 0;
      default:
        return false;
    }
  }

  /**
   * Send reminder notifications
   */
  async sendReminderNotifications(pkg, timeUntilExpiry) {
    try {
      const owner = pkg.ownerId;
      const ownerName = `${owner.firstName} ${owner.lastName}`;

      // Calculate human-readable time until expiry
      const hoursUntilExpiry = Math.ceil(timeUntilExpiry / (60 * 60 * 1000));
      const daysUntilExpiry = Math.ceil(timeUntilExpiry / (24 * 60 * 60 * 1000));
      
      let timeString;
      if (hoursUntilExpiry <= 24) {
        timeString = `${hoursUntilExpiry} hour${hoursUntilExpiry !== 1 ? 's' : ''}`;
      } else {
        timeString = `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`;
      }

      // Get all unique participant emails (exclude owner for reminders)
      const participantEmails = new Set([
        ...pkg.fields.flatMap(f => 
          f.assignedUsers.map(au => au.contactEmail)
        ),
        ...pkg.receivers.map(r => r.contactEmail)
      ]);

      // Send reminder to participants
      for (const email of participantEmails) {
        await this.emailService.sendExpiryReminderNotification(
          email,
          ownerName,
          pkg.name,
          timeString,
          pkg.options.expiresAt
        );
      }

    } catch (error) {
      console.error(`Error sending reminder notifications for package ${pkg._id}:`, error);
    }
  }
}

module.exports = ReminderJob;