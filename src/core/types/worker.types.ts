import { Job } from 'bullmq';

export type JobHandler = (job: Job) => Promise<any>;
