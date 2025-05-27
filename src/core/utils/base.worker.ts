import { Worker, Job, QueueOptions, Processor } from 'bullmq';
import { WorkerError } from 'src/core/server';
import { LoggerService } from 'src/core/services';
import type { JobHandler } from 'src/core/types';

/**
 * Abstract base worker that listens to a BullMQ queue and dispatches jobs by name.
 */
export abstract class BaseWorker {
  /** BullMQ Worker instance */
  protected worker: Worker | null = null;

  /** Map of job names to their handler functions */
  private readonly handlers = new Map<string, JobHandler>();

  /**
   * @param logger - Logger service instance
   * @param queueName - Name of the queue to listen to
   */
  protected constructor(
    protected readonly logger: LoggerService,
    protected readonly queueName: string,
  ) {
    this.registerDefaultHandlers();
  }

  /**
   * Hook for subclasses to register default job handlers.
   * Override in subclass if needed.
   */
  protected registerDefaultHandlers(): void {
    // no-op
  }

  /**
   * Register a new job handler. Can be used to extend handlers dynamically.
   * @param name - Job name
   * @param handler - Async function to handle the job
   */
  registerJobHandler(name: string, handler: JobHandler): void {
    if (this.handlers.has(name)) {
      this.logger.warn(
        `${this.createWorkerLogPrefix()} Overwriting handler for job "${name}"`,
      );
    }
    this.handlers.set(name, handler);
  }

  /**
   * Initialize and start the BullMQ Worker.
   * @param options - Worker options, typically including connection details
   */
  async initWorker(options: QueueOptions): Promise<void> {
    if (this.worker) return;

    try {
      const dispatch: Processor = async (job: Job) => this.process(job);

      this.worker = new Worker(this.queueName, dispatch, options);
      this.setupWorkerEventListeners();
      this.logger.info(`${this.createWorkerLogPrefix()} Worker ready.`);
    } catch (error) {
      this.handleWorkerInitError(error);
    }
  }

  /**
   * Core processing logic: find the handler by job name and execute it.
   * Extracted for clarity and testability.
   */
  private async process(job: Job): Promise<any> {
    const handler = this.handlers.get(job.name);
    if (!handler) {
      const msg = `No handler registered for job "${job.name}"`;
      this.logger.error(`${this.createWorkerLogPrefix()} ${msg}`);
      throw new WorkerError(msg);
    }

    this.logger.info(
      `${this.createWorkerLogPrefix()} Processing ${this.formatJobInfo(job)}`,
    );
    try {
      return await handler(job);
    } catch (err) {
      const actualError = err instanceof Error ? err : new Error(String(err));
      this.logger.error(
        `${this.createWorkerLogPrefix()} Error in handler ${job.name}: ${actualError.message}`,
      );
      throw new WorkerError(
        `Failed to process job ${job.name} (ID: ${job.id})`,
        actualError,
      );
    }
  }

  /** Helper to build a consistent log prefix */
  protected createWorkerLogPrefix(): string {
    return `[Worker][${this.queueName}]:`;
  }

  /** Format job information for logging */
  protected formatJobInfo(job: Job): string {
    return `Job ${job.id} (${job.name})`;
  }

  /** Attach completed/failed/error listeners to the worker */
  private setupWorkerEventListeners(): void {
    if (!this.worker) return;
    const prefix = this.createWorkerLogPrefix();

    this.worker.on('completed', (job) => {
      this.logger.info(`${prefix} ${this.formatJobInfo(job)} completed.`);
    });

    this.worker.on('failed', (job, error) => {
      const info = job ? this.formatJobInfo(job) : 'Unknown job';
      this.logger.error(`${prefix} ${info} failed: ${error.message}`);
    });

    this.worker.on('error', (error) => {
      this.logger.error(`${prefix} error: ${error.message}`);
    });
  }

  /**
   * Handle worker initialization errors uniformly.
   * @throws WorkerError always, wrapping the original error
   */
  private handleWorkerInitError(error: unknown): void {
    const actualError =
      error instanceof Error ? error : new Error(String(error));
    this.logger.error(
      `${this.createWorkerLogPrefix()} Failed to init worker: ${actualError.message}`,
    );
    throw new WorkerError(
      `Worker init failed for ${this.queueName}`,
      actualError,
    );
  }

  /**
   * Close the worker gracefully.
   */
  async close(): Promise<void> {
    if (!this.worker) return;
    await this.worker.close();
    this.logger.info(`${this.createWorkerLogPrefix()} Worker closed.`);
  }
}
