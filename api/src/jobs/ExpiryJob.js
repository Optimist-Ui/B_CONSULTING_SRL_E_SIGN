const BaseJob = require("./BaseJob");

class ExpiryJob extends BaseJob {
  constructor(container) {
    super(container);
    this.Package = container.resolve("Package");
    this.User = container.resolve("User");
    this.emailService = container.resolve("emailService");
    this.packageService = container.resolve("packageService"); // For emit
  }

  /**
   * Run every hour at minute 0
   */
  get schedule() {
    return "0 * * * *";
  }

  /**
   * Execute the expiry job
   */
  async execute() {
    const startTime = new Date();
    console.log(`Starting package expiry job at ${startTime.toISOString()}`);

    try {
      const expiredPackages = await this.expirePackages();

      this.updateLastRun();

      const endTime = new Date();
      const duration = endTime - startTime;

      console.log(
        `Package expiry job completed in ${duration}ms. Expired ${expiredPackages.length} packages.`
      );

      return expiredPackages;
    } catch (error) {
      console.error("Error in ExpiryJob execution:", error);
      throw error;
    }
  }

  /**
   * Find and expire packages
   */
  async expirePackages() {
    const now = new Date();

    try {
      // Find packages that should be expired
      const packagesToExpire = await this.Package.find({
        "options.expiresAt": { $lte: now },
        status: { $in: ["Sent", "Draft"] },
      }).populate("ownerId", "firstName lastName email");

      if (packagesToExpire.length === 0) {
        console.log("No packages to expire");
        return [];
      }

      console.log(`Found ${packagesToExpire.length} packages to expire`);

      const expiredPackages = [];

      for (const pkg of packagesToExpire) {
        try {
          // Update package status to expired
          pkg.status = "Expired";
          await pkg.save();

          expiredPackages.push(pkg);

          // Send expiry notifications
          await this.sendExpiryNotifications(pkg);

          // Emit real-time update using packageService
          await this.packageService.emitPackageUpdate(pkg);

          console.log(`Expired package: ${pkg.name} (ID: ${pkg._id})`);
        } catch (error) {
          console.error(`Error expiring package ${pkg._id}:`, error);
        }
      }

      return expiredPackages;
    } catch (error) {
      console.error("Error in expirePackages method:", error);
      throw error;
    }
  }

  /**
   * Send expiry notifications to all participants
   */
  async sendExpiryNotifications(pkg) {
    try {
      const owner = pkg.ownerId;
      const ownerName = `${owner.firstName} ${owner.lastName}`;

      // Get all unique participant emails
      const participantEmails = new Set([
        owner.email, // Include owner
        ...pkg.fields.flatMap((f) =>
          f.assignedUsers.map((au) => au.contactEmail)
        ),
        ...pkg.receivers.map((r) => r.contactEmail),
      ]);

      // Send expiry notification to all participants
      for (const email of participantEmails) {
        await this.emailService.sendDocumentExpiredNotification(
          email,
          ownerName,
          pkg.name,
          pkg.options.expiresAt
        );
      }
    } catch (error) {
      console.error(
        `Error sending expiry notifications for package ${pkg._id}:`,
        error
      );
    }
  }
}

module.exports = ExpiryJob;
