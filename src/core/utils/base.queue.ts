import {
  Queue,
  Job,
  JobsOptions,
  QueueOptions,
  QueueEvents,
  BulkJobOptions,
} from 'bullmq';
import { LoggerService } from 'src/core/services';
import { IQueueService, QueueJob } from 'src/core/types';
import { QueueError } from '../server';

/**
 * Base class for all queue services, providing common queue operations
 * and unified error handling.
 */
export abstract class BaseQueue<TData = unknown>
  implements IQueueService<TData>
{
  protected queue: Queue | null = null;
  protected events: QueueEvents | null = null;

  /**
   * Constructor
   * @param logger Logger service instance
   * @param queueName Name of the BullMQ queue
   */
  protected constructor(
    protected readonly logger: LoggerService,
    protected readonly queueName: string,
  ) {}

  /**
   * Initialize the queue and its event listener, waiting until ready
   * @param options BullMQ queue options
   */
  async initQueue(options: QueueOptions): Promise<void> {
    if (this.queue) return;

    try {
      this.queue = new Queue(this.queueName, options);
      await this.queue.waitUntilReady();

      // Initialize event listener for lifecycle events
      this.events = new QueueEvents(this.queueName, options);
      await this.events.waitUntilReady();

      this.registerQueueEvents();
      this.registerJobLifecycleEvents();

      this.logger.info(`Queue ${this.queueName} initialized and ready.`);
    } catch (error) {
      const actualError = error as Error;
      this.logger.error(
        `Failed to initialize queue ${this.queueName}: ${actualError.message}`,
      );
      throw new QueueError(
        `Queue initialization failed for ${this.queueName}`,
        actualError,
      );
    }
  }

  /** Helper method for creating a common log format prefix */
  protected createQueueLogPrefix(): string {
    return `[Queue][${this.queueName}]:`;
  }

  /** Format job task information */
  protected formatJobInfo(jobId: string | number | undefined): string {
    return jobId !== undefined ? `Job ${jobId}` : `Job (unknown)`;
  }

  /**
   * Register queue-level events
   */
  private registerQueueEvents(): void {
    if (!this.queue) return;

    const queuePrefix = this.createQueueLogPrefix();

    this.queue.on('error', (error) =>
      this.logger.error(`${queuePrefix} error: ${error.message}`),
    );

    this.queue.on('waiting', (job: Job) => {
      const jobInfo = this.formatJobInfo(job.id);
      this.logger.debug(`${queuePrefix} ${jobInfo} waiting...`);
    });

    this.queue.on('paused', () => this.logger.info(`${queuePrefix} paused`));

    this.queue.on('resumed', () => this.logger.info(`${queuePrefix} resumed`));

    this.queue.on('cleaned', (jobs, type) =>
      this.logger.info(`${queuePrefix} cleaned ${jobs.length} ${type} jobs`),
    );
  }

  /**
   * Register job lifecycle events
   */
  private registerJobLifecycleEvents(): void {
    if (!this.events) return;

    const queuePrefix = this.createQueueLogPrefix();

    this.events.on('completed', ({ jobId }) => {
      const jobInfo = this.formatJobInfo(jobId);
      this.logger.info(`${queuePrefix} ${jobInfo} completed`);
    });

    this.events.on('failed', ({ jobId, failedReason }) => {
      const jobInfo = this.formatJobInfo(jobId);
      this.logger.warn(`${queuePrefix} ${jobInfo} failed: ${failedReason}`);
    });
  }

  /**
   * Ensure the queue has been initialized
   * @throws {QueueError} if not initialized
   */
  protected ensureQueue(): Queue {
    if (!this.queue) {
      const msg = `Queue ${this.queueName} is not initialized`;
      this.logger.warn(msg);
      throw new QueueError(msg);
    }
    return this.queue;
  }

  /**
   * Execute an operation on the queue with unified error handling
   * @param op The operation callback
   */
  protected async withQueue<T>(op: (q: Queue) => Promise<T>): Promise<T> {
    try {
      const queue = this.ensureQueue();
      return await op(queue);
    } catch (error) {
      const actualError = error as Error;
      if (actualError instanceof QueueError) {
        throw actualError;
      }

      const errorMessage = `Queue ${this.queueName} operation failed: ${actualError.message}`;
      throw new QueueError(errorMessage, actualError);
    }
  }

  /**
   * Add a job to the queue
   */
  async addJob(
    name: string,
    data: TData,
    jobsOptions?: JobsOptions,
  ): Promise<Job> {
    return this.withQueue(async (q) => {
      const job = await q.add(name, data, jobsOptions);
      const jobInfo = this.formatJobInfo(job.id);
      this.logger.debug(`${this.createQueueLogPrefix()} ${jobInfo} added.`);
      return job;
    });
  }

  /**
   * Add multiple jobs in bulk
   */
  async addBulkJob(jobs: Array<QueueJob<TData>>): Promise<Job[]> {
    return this.withQueue(async (q) => {
      const bullJobs = jobs.map((job) => ({
        name: job.name,
        data: job.data,
        opts: job.jobOptions as BulkJobOptions,
      }));

      const added = await q.addBulk(bullJobs);
      this.logger.info(
        `Added ${added.length} jobs in bulk to ${this.queueName}`,
      );
      return added;
    });
  }

  /**
   * Retrieve a job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    try {
      return await this.withQueue(async (q) => {
        const job = await q.getJob(jobId);
        if (job) {
          this.logger.debug(`Retrieved job ${jobId}`);
        } else {
          this.logger.warn(`Job ${jobId} not found`);
        }
        return job;
      });
    } catch (error) {
      if (error instanceof QueueError) return null;
      throw error;
    }
  }

  /**
   * Remove a job by ID
   */
  async removeJob(jobId: string): Promise<boolean> {
    return this.withQueue(async (q) => {
      const job = await q.getJob(jobId);
      if (job) {
        await job.remove();
        this.logger.info(`Job ${jobId} removed from ${this.queueName}`);
        return true;
      }
      this.logger.warn(
        `Cannot remove job ${jobId}: not found in ${this.queueName}`,
      );
      return false;
    });
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<boolean> {
    return this.withQueue(async (q) => {
      await q.pause();
      this.logger.info(`Queue ${this.queueName} paused successfully`);
      return true;
    });
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<boolean> {
    return this.withQueue(async (q) => {
      await q.resume();
      this.logger.info(`Queue ${this.queueName} resumed successfully`);
      return true;
    });
  }

  /**
   * Clean completed or delayed jobs
   * @param grace Grace period in ms
   * @param limit Max number of jobs to clean
   * @returns Count of cleaned jobs
   */
  async clean(grace: number, limit: number): Promise<number> {
    return this.withQueue((q) =>
      q.clean(grace, limit).then((ids) => {
        this.logger.info(`Cleaned ${ids.length} jobs from ${this.queueName}`);
        return ids.length;
      }),
    );
  }

  /**
   * Close the queue and its event listener
   */
  async close(): Promise<boolean> {
    if (!this.queue) return true;

    try {
      await this.queue.close();
      if (this.events) {
        await this.events.close();
      }
      this.logger.info(`Queue ${this.queueName} closed successfully`);
      return true;
    } catch (error) {
      const actualError = error as Error;
      this.logger.error(
        `Error closing queue ${this.queueName}: ${actualError.message}`,
      );
      throw new QueueError(
        `Failed to close queue ${this.queueName}`,
        actualError,
      );
    }
  }
}
