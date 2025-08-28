class BaseJob {
  constructor(container) {
    this.container = container;
    this.lastRun = null;
  }

  /**
   * Execute the job - to be implemented by subclasses
   */
  async execute() {
    throw new Error('execute() method must be implemented by subclass');
  }

  /**
   * Get the cron schedule - to be implemented by subclasses
   */
  get schedule() {
    throw new Error('schedule getter must be implemented by subclass');
  }

  /**
   * Update last run timestamp
   */
  updateLastRun() {
    this.lastRun = new Date();
  }
}

module.exports = BaseJob;