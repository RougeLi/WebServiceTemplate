import { Job, JobsOptions } from 'bullmq';

/**
 * Queue service interface
 */
export interface IQueueService<TData = unknown> {
  addJob(name: string, data: TData, jobsOptions?: JobsOptions): Promise<Job>;

  addBulkJob(jobs: Array<QueueJob<TData>>): Promise<Job[]>;

  getJob(jobId: string): Promise<Job | null>;

  removeJob(jobId: string): Promise<boolean>;

  pause(): Promise<boolean>;

  resume(): Promise<boolean>;

  clean(grace: number, limit: number): Promise<number>;

  close(): Promise<boolean>;
}

/**
 * Queue job type definition for bulk operations
 */
export interface QueueJob<TData = unknown> {
  /** Name of the job */
  name: string;
  /** Payload data for the job */
  data: TData;
  /** Optional BullMQ job options */
  jobOptions?: JobsOptions;
}
