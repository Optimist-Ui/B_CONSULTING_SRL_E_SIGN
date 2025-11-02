const BaseJob = require("./BaseJob");

class ExpiryJob extends BaseJob {
  constructor(container) {
    super(container);
    this.Package = container.resolve("Package");
    this.User = container.resolve("User");
    this.emailService = container.resolve("emailService");
    this.packageService = container.resolve("packageService");
    this.Contact = container.resolve("Contact");
  }

  /**
   * Run every 30 minutes (aligns with ReminderJob)
   * Reduces average expiry delay from 30min to 15min
   */
  get schedule() {
    return "*/30 * * * *"; // Changed from '0 * * * *'
  }

  /**
   * Execute the expiry job
   */
  async execute() {
    const startTime = new Date();
    console.log(`Starting package expiry job at ${startTime.toISOString()}`);

    try {
      const result = await this.expirePackages();

      this.updateLastRun();

      const endTime = new Date();
      const duration = endTime - startTime;

      console.log(
        `Package expiry job completed in ${duration}ms. ` +
          `Expired: ${result.expired}, Skipped: ${result.skipped}`
      );

      return result;
    } catch (error) {
      console.error("Error in ExpiryJob execution:", error);
      throw error;
    }
  }

  /**
   * Find and expire packages with comprehensive validation
   */
  async expirePackages() {
    const now = new Date();
    let expired = 0;
    let skipped = 0;
    const errors = [];

    try {
      // Find packages that should be expired
      // Only select packages with expiresAt set
      const packagesToExpire = await this.Package.find({
        "options.expiresAt": { $exists: true, $ne: null, $lte: now },
        status: { $in: ["Sent", "Draft"] },
      }).populate("ownerId", "firstName lastName email");

      if (packagesToExpire.length === 0) {
        console.log("✅ No packages to expire");
        return { expired: 0, skipped: 0, errors: [] };
      }

      console.log(`Found ${packagesToExpire.length} packages to expire`);

      for (const pkg of packagesToExpire) {
        try {
          // Validation checks
          if (!pkg.options.expiresAt) {
            console.warn(`⚠️  Package ${pkg._id} has no expiry date, skipping`);
            skipped++;
            continue;
          }

          if (!["Sent", "Draft"].includes(pkg.status)) {
            console.warn(
              `⚠️  Package ${pkg._id} has status ${pkg.status}, skipping`
            );
            skipped++;
            continue;
          }

          if (pkg.options.expiresAt > now) {
            console.warn(`⚠️  Package ${pkg._id} not yet expired, skipping`);
            skipped++;
            continue;
          }

          // Update package status to expired
          pkg.status = "Expired";
          await pkg.save();

          // Send expiry notifications
          await this.sendExpiryNotifications(pkg);

          // Emit real-time update using packageService
          await this.packageService.emitPackageUpdate(pkg);

          expired++;
          console.log(`✅ Expired package: ${pkg.name} (ID: ${pkg._id})`);
        } catch (error) {
          console.error(`❌ Error expiring package ${pkg._id}:`, error);
          errors.push({
            packageId: pkg._id,
            packageName: pkg.name,
            error: error.message,
          });
          skipped++;
        }
      }

      return {
        expired,
        skipped,
        errors,
        total: packagesToExpire.length,
      };
    } catch (error) {
      console.error("Error in expirePackages method:", error);
      throw error;
    }
  }

  /**
   * Send expiry notifications to all participants
   */
  async sendExpiryNotifications(pkg) {
    const emailsSent = [];
    const emailsFailed = [];

    try {
      const owner = pkg.ownerId; // Assumes ownerId is populated
      if (!owner) {
        console.warn(
          `⚠️ Package ${pkg._id} has no owner, skipping notifications`
        );
        return { emailsSent, emailsFailed };
      }

      const ownerName = `${owner.firstName} ${owner.lastName}`;
      const allRecipients = new Map();

      // 1. Gather all participants and their contactIds
      pkg.fields.forEach((field) => {
        (field.assignedUsers || []).forEach((user) => {
          if (!allRecipients.has(user.contactEmail)) {
            allRecipients.set(user.contactEmail, {
              contactId: user.contactId,
              name: user.contactName,
              email: user.contactEmail,
              isOwner: false,
            });
          }
        });
      });

      pkg.receivers.forEach((receiver) => {
        if (!allRecipients.has(receiver.contactEmail)) {
          allRecipients.set(receiver.contactEmail, {
            contactId: receiver.contactId,
            name: receiver.contactName,
            email: receiver.contactEmail,
            isOwner: false,
          });
        }
      });

      // Add the owner to the list
      if (!allRecipients.has(owner.email)) {
        allRecipients.set(owner.email, {
          name: ownerName,
          email: owner.email,
          isOwner: true,
        });
      }

      // 2. Efficiently fetch language preferences for all contacts
      const contactIds = Array.from(allRecipients.values())
        .filter((r) => !r.isOwner && r.contactId)
        .map((r) => r.contactId);

      const contacts = await this.Contact.find({
        _id: { $in: contactIds },
      }).select("language");
      const languageMap = new Map(
        contacts.map((c) => [c._id.toString(), c.language])
      );

      console.log(
        `Sending expiry notifications to ${allRecipients.size} recipients`
      );

      // 3. Loop through recipients and send notifications with the correct language
      for (const recipient of allRecipients.values()) {
        try {
          // Determine language
          if (recipient.isOwner) {
            recipient.language = owner.language || "en";
          } else {
            recipient.language =
              languageMap.get(recipient.contactId.toString()) || "en";
          }

          await this.emailService.sendDocumentExpiredNotification(
            recipient, // Pass the entire enriched object
            ownerName,
            pkg.name,
            pkg.options.expiresAt
          );
          emailsSent.push(recipient.email);
        } catch (error) {
          console.error(
            `Failed to send expiry email to ${recipient.email}:`,
            error
          );
          emailsFailed.push({ email: recipient.email, error: error.message });
        }
      }

      console.log(
        `✅ Sent ${emailsSent.length} expiry notifications, ${emailsFailed.length} failed`
      );
      return { emailsSent, emailsFailed };
    } catch (error) {
      console.error(
        `Error sending expiry notifications for package ${pkg._id}:`,
        error
      );
      throw error;
    }
  }
}

module.exports = ExpiryJob;
