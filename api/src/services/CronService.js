const cron = require("node-cron");

class CronService {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
    this.executionHistory = new Map(); // Track execution history
  }

  /**
   * Initialize all cron jobs
   */
  initialize(container) {
    if (this.isInitialized) {
      console.log("⚠️  CronService already initialized");
      return;
    }

    console.log("🚀 Initializing CronService...");

    try {
      // Import and register all jobs
      const ExpiryJob = require("../jobs/ExpiryJob");
      const ReminderJob = require("../jobs/ReminderJob");
      const SubscriptionExpiryJob = require("../jobs/SubscriptionExpiryJob");
      const DeleteExpiredAccountsJob = require("../jobs/DeleteExpiredAccountsJob");
      const CardVerificationReminderJob = require("../jobs/CardVerificationReminderJob");

      // Initialize jobs with container dependencies
      const expiryJob = new ExpiryJob(container);
      const reminderJob = new ReminderJob(container);
      const subscriptionExpiryJob = new SubscriptionExpiryJob(container);
      const deleteExpiredAccountsJob = new DeleteExpiredAccountsJob(container);
      const cardVerificationReminderJob = new CardVerificationReminderJob(
        container
      );

      // Register jobs
      this.registerJob("packageExpiry", expiryJob);
      this.registerJob("expiryReminders", reminderJob);
      this.registerJob("subscriptionExpiry", subscriptionExpiryJob);
      this.registerJob("deleteExpiredAccounts", deleteExpiredAccountsJob);
      this.registerJob("cardVerificationReminder", cardVerificationReminderJob);

      this.isInitialized = true;
      console.log("✅ CronService initialized successfully");
      this.printJobsSummary();
    } catch (error) {
      console.error("❌ Failed to initialize CronService:", error);
      throw error;
    }
  }

  /**
   * Register a cron job with enhanced error handling
   */
  registerJob(name, jobInstance) {
    if (this.jobs.has(name)) {
      console.log(`⚠️  Job ${name} already registered`);
      return;
    }

    try {
      // Validate job instance
      if (!jobInstance.execute || typeof jobInstance.execute !== "function") {
        throw new Error(`Job ${name} must have an execute() method`);
      }
      if (!jobInstance.schedule) {
        throw new Error(`Job ${name} must have a schedule property`);
      }

      const schedule = jobInstance.schedule;

      // ✅ Validate cron expression format (5 parts)
      const parts = schedule.trim().split(/\s+/);
      if (parts.length !== 5) {
        throw new Error(
          `Job ${name} has invalid cron expression format: ${schedule} (must have 5 parts)`
        );
      }

      // Validate cron expression with node-cron
      if (!cron.validate(schedule)) {
        throw new Error(`Job ${name} has invalid cron expression: ${schedule}`);
      }

      const cronJob = cron.schedule(
        jobInstance.schedule,
        async () => {
          await this.executeJob(name, jobInstance);
        },
        {
          scheduled: false,
          timezone: process.env.TZ || "UTC",
        }
      );

      this.jobs.set(name, {
        instance: jobInstance,
        cronJob: cronJob,
        name: name,
        schedule: jobInstance.schedule,
        enabled: true,
      });

      // Initialize execution history
      this.executionHistory.set(name, {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        lastRun: null,
        lastSuccess: null,
        lastFailure: null,
        lastError: null,
      });

      cronJob.start();
      console.log(
        `✅ Job "${name}" registered and started (${jobInstance.schedule})`
      );
    } catch (error) {
      console.error(`❌ Failed to register job "${name}":`, error.message);
      throw error;
    }
  }

  /**
   * Execute a job with comprehensive error handling and logging
   */
  async executeJob(name, jobInstance) {
    const startTime = Date.now();
    const history = this.executionHistory.get(name);

    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔄 Executing job: ${name}`);
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`${"=".repeat(60)}\n`);

    try {
      const result = await jobInstance.execute();

      const duration = Date.now() - startTime;

      // Update history
      history.totalRuns++;
      history.successfulRuns++;
      history.lastRun = new Date();
      history.lastSuccess = new Date();

      console.log(`\n${"=".repeat(60)}`);
      console.log(`✅ Job "${name}" completed successfully`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Result:`, JSON.stringify(result, null, 2));
      console.log(`${"=".repeat(60)}\n`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Update history
      history.totalRuns++;
      history.failedRuns++;
      history.lastRun = new Date();
      history.lastFailure = new Date();
      history.lastError = error.message;

      console.error(`\n${"=".repeat(60)}`);
      console.error(`❌ Job "${name}" failed`);
      console.error(`   Duration: ${duration}ms`);
      console.error(`   Error:`, error);
      console.error(`   Stack:`, error.stack);
      console.error(`${"=".repeat(60)}\n`);

      // ✅ Don't throw - allow other jobs to continue
      return { error: error.message };
    }
  }

  /**
   * Start all jobs
   */
  startAll() {
    console.log("\n🚀 Starting all cron jobs...");
    let started = 0;

    for (const [name, job] of this.jobs) {
      if (!job.enabled) {
        console.log(`⏭️  Skipping disabled job: ${name}`);
        continue;
      }

      job.cronJob.start();
      started++;
      console.log(`✅ Started job: ${name}`);
    }

    console.log(`✅ Started ${started}/${this.jobs.size} jobs\n`);
  }

  /**
   * Stop all jobs
   */
  stopAll() {
    console.log("\n🛑 Stopping all cron jobs...");
    let stopped = 0;

    for (const [name, job] of this.jobs) {
      job.cronJob.stop();
      stopped++;
      console.log(`✅ Stopped job: ${name}`);
    }

    console.log(`✅ Stopped ${stopped}/${this.jobs.size} jobs\n`);
  }

  /**
   * Stop a specific job
   */
  stopJob(name) {
    const job = this.jobs.get(name);
    if (!job) {
      console.warn(`⚠️  Job "${name}" not found`);
      return false;
    }

    job.cronJob.stop();
    job.enabled = false;
    console.log(`✅ Stopped job: ${name}`);
    return true;
  }

  /**
   * Start a specific job
   */
  startJob(name) {
    const job = this.jobs.get(name);
    if (!job) {
      console.warn(`⚠️  Job "${name}" not found`);
      return false;
    }

    job.cronJob.start();
    job.enabled = true;
    console.log(`✅ Started job: ${name}`);
    return true;
  }

  /**
   * Manually trigger a job execution
   */
  async triggerJob(name) {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Job "${name}" not found`);
    }

    console.log(`🔄 Manually triggering job: ${name}`);
    return await this.executeJob(name, job.instance);
  }

  /**
   * Get job status with execution history
   */
  getJobStatus(name) {
    const job = this.jobs.get(name);
    if (!job) {
      return null;
    }

    const history = this.executionHistory.get(name);

    return {
      name: job.name,
      schedule: job.schedule,
      enabled: job.enabled,
      running: job.cronJob.running,
      lastRun: job.instance.lastRun || null,
      history: {
        totalRuns: history.totalRuns,
        successfulRuns: history.successfulRuns,
        failedRuns: history.failedRuns,
        successRate:
          history.totalRuns > 0
            ? ((history.successfulRuns / history.totalRuns) * 100).toFixed(2) +
              "%"
            : "N/A",
        lastSuccess: history.lastSuccess,
        lastFailure: history.lastFailure,
        lastError: history.lastError,
      },
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

  /**
   * Print jobs summary on initialization
   */
  printJobsSummary() {
    console.log("\n" + "=".repeat(60));
    console.log("📋 Registered Cron Jobs Summary");
    console.log("=".repeat(60));

    for (const [name, job] of this.jobs) {
      console.log(`\n📌 ${name}`);
      console.log(`   Schedule: ${job.schedule}`);
      console.log(`   Timezone: ${process.env.TZ || "UTC"}`);
      console.log(`   Status: ${job.enabled ? "✅ Enabled" : "❌ Disabled"}`);
    }

    console.log("\n" + "=".repeat(60) + "\n");
  }

  /**
   * Get health status of all jobs
   */
  getHealthStatus() {
    const jobs = this.getAllJobsStatus();
    const unhealthyJobs = jobs.filter((j) => {
      const history = j.history;
      // Consider job unhealthy if last 3 runs failed
      return history.totalRuns >= 3 && history.failedRuns >= 3;
    });

    return {
      healthy: unhealthyJobs.length === 0,
      totalJobs: jobs.length,
      unhealthyJobs: unhealthyJobs.map((j) => j.name),
      jobs: jobs,
    };
  }
}

module.exports = CronService;
