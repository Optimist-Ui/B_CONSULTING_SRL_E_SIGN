const cron = require("node-cron");

class CronService {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize all cron jobs
   */
  initialize(container) {
    if (this.isInitialized) {
      console.log("CronService already initialized");
      return;
    }

    console.log("Initializing CronService...");

    // Import and register all jobs
    const ExpiryJob = require("../jobs/ExpiryJob");
    const ReminderJob = require("../jobs/ReminderJob");
    const SubscriptionExpiryJob = require("../jobs/SubscriptionExpiryJob");
    const DeleteExpiredAccountsJob = require("../jobs/DeleteExpiredAccountsJob");

    // Initialize jobs with container dependencies
    const expiryJob = new ExpiryJob(container);
    const reminderJob = new ReminderJob(container);
    const subscriptionExpiryJob = new SubscriptionExpiryJob(container);
    const deleteExpiredAccountsJob = new DeleteExpiredAccountsJob(container);

    // Register jobs
    this.registerJob("packageExpiry", expiryJob);
    this.registerJob("expiryReminders", reminderJob);
    this.registerJob("subscriptionExpiry", subscriptionExpiryJob);
    this.registerJob("deleteExpiredAccounts", deleteExpiredAccountsJob);

    this.isInitialized = true;
    console.log("CronService initialized successfully");
  }

  /**
   * Register a cron job
   */
  registerJob(name, jobInstance) {
    if (this.jobs.has(name)) {
      console.log(`Job ${name} already registered`);
      return;
    }

    try {
      const cronJob = cron.schedule(
        jobInstance.schedule,
        async () => {
          console.log(`Running job: ${name}`);
          try {
            await jobInstance.execute();
          } catch (error) {
            console.error(`Error in job ${name}:`, error);
          }
        },
        {
          scheduled: false,
          timezone: "UTC",
        }
      );

      this.jobs.set(name, {
        instance: jobInstance,
        cronJob: cronJob,
        name: name,
      });

      cronJob.start();
      console.log(`Job ${name} registered and started`);
    } catch (error) {
      console.error(`Failed to register job ${name}:`, error);
    }
  }

  /**
   * Start all jobs
   */
  startAll() {
    console.log("Starting all cron jobs...");
    for (const [name, job] of this.jobs) {
      job.cronJob.start();
      console.log(`Started job: ${name}`);
    }
  }

  /**
   * Stop all jobs
   */
  stopAll() {
    console.log("Stopping all cron jobs...");
    for (const [name, job] of this.jobs) {
      job.cronJob.stop();
      console.log(`Stopped job: ${name}`);
    }
  }

  /**
   * Stop a specific job
   */
  stopJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.cronJob.stop();
      console.log(`Stopped job: ${name}`);
    }
  }

  /**
   * Get job status
   */
  getJobStatus(name) {
    const job = this.jobs.get(name);
    if (!job) {
      return null;
    }

    return {
      name: job.name,
      schedule: job.instance.schedule,
      running: job.cronJob.running,
      lastRun: job.instance.lastRun || null,
    };
  }

  /**
   * Get all jobs status
   */
  getAllJobsStatus() {
    const status = [];
    for (const [name] of this.jobs) {
      status.push(this.getJobStatus(name));
    }
    return status;
  }
}

module.exports = CronService;
