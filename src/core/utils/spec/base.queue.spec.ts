import { Job, Queue, QueueEvents } from 'bullmq';
import { QueueError } from '../../server';
import { LoggerService } from '../../services';
import { BaseQueue } from '../base.queue';

// Mock implementation of BaseQueue for testing
class TestQueue extends BaseQueue<{ testData: string }> {
  constructor(logger: LoggerService) {
    super(logger, 'test-queue');
  }
}

// Mock Queue and QueueEvents
jest.mock('bullmq', () => {
  const originalModule = jest.requireActual('bullmq');

  // Mock Queue class
  const mockQueue = {
    waitUntilReady: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    add: jest.fn(),
    addBulk: jest.fn(),
    getJob: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    clean: jest.fn(),
    close: jest.fn(),
  };

  // Mock QueueEvents class
  const mockQueueEvents = {
    waitUntilReady: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    close: jest.fn(),
  };

  return {
    ...originalModule,
    Queue: jest.fn(() => mockQueue),
    QueueEvents: jest.fn(() => mockQueueEvents),
  };
});

describe('BaseQueue', () => {
  let queue: TestQueue;
  let loggerMock: jest.Mocked<LoggerService>;
  let mockQueue: jest.Mocked<Queue>;
  let mockQueueEvents: jest.Mocked<QueueEvents>;
  // Define mock queue options with the required connection property
  const mockQueueOptions = {
    connection: {
      host: 'localhost',
      port: 6379,
    },
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create logger mock
    loggerMock = {
      trace: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      init: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    // Create queue instance
    queue = new TestQueue(loggerMock);

    // Get mock instances directly from the mock implementation
    // This ensures they're available before any tests run
    mockQueue = {
      waitUntilReady: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      add: jest.fn(),
      addBulk: jest.fn(),
      getJob: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      clean: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<Queue>;

    mockQueueEvents = {
      waitUntilReady: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<QueueEvents>;

    // Override the mock implementations to return our instances
    (Queue as unknown as jest.Mock).mockImplementation(() => mockQueue);
    (QueueEvents as unknown as jest.Mock).mockImplementation(
      () => mockQueueEvents,
    );
  });

  describe('initQueue', () => {
    it('should initialize the queue and events', async () => {
      await queue.initQueue(mockQueueOptions);

      expect(Queue).toHaveBeenCalledWith('test-queue', mockQueueOptions);
      expect(mockQueue.waitUntilReady).toHaveBeenCalled();
      expect(QueueEvents).toHaveBeenCalledWith('test-queue', mockQueueOptions);
      expect(mockQueueEvents.waitUntilReady).toHaveBeenCalled();
      expect(mockQueue.on).toHaveBeenCalledTimes(5); // error, waiting, paused, resumed, cleaned
      expect(mockQueueEvents.on).toHaveBeenCalledTimes(2); // completed, failed
      expect(loggerMock.info).toHaveBeenCalledWith(
        'Queue test-queue initialized and ready.',
      );
    });

    it('should throw QueueError when initialization fails', async () => {
      mockQueue.waitUntilReady.mockRejectedValueOnce(
        new Error('Connection failed'),
      );

      await expect(queue.initQueue(mockQueueOptions)).rejects.toThrow(
        QueueError,
      );
      expect(loggerMock.error).toHaveBeenCalled();
    });

    it('should not reinitialize if queue already exists', async () => {
      // Initialize once
      await queue.initQueue(mockQueueOptions);
      jest.clearAllMocks();

      // Try to initialize again
      await queue.initQueue(mockQueueOptions);

      // Should not create a new Queue
      expect(Queue).not.toHaveBeenCalled();
    });
  });

  describe('addJob', () => {
    beforeEach(async () => {
      await queue.initQueue(mockQueueOptions);
      jest.clearAllMocks();
    });

    it('should add a job to the queue', async () => {
      const mockJob = { id: 'job123' } as unknown as Job;
      mockQueue.add.mockResolvedValueOnce(mockJob);

      const jobData = { testData: 'test value' };
      const jobOptions = { delay: 1000 };

      const job = await queue.addJob('test-job', jobData, jobOptions);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'test-job',
        jobData,
        jobOptions,
      );
      expect(job.id).toBe('job123');
      expect(loggerMock.debug).toHaveBeenCalled();
    });

    it('should throw QueueError when adding job fails', async () => {
      mockQueue.add.mockRejectedValueOnce(new Error('Add job failed'));

      await expect(
        queue.addJob('test-job', { testData: 'test' }),
      ).rejects.toThrow(QueueError);
    });
  });

  describe('addBulkJob', () => {
    beforeEach(async () => {
      await queue.initQueue(mockQueueOptions);
      jest.clearAllMocks();
    });

    it('should add multiple jobs in bulk', async () => {
      const mockJobs = [
        { id: 'job1' } as unknown as Job,
        { id: 'job2' } as unknown as Job,
      ];
      mockQueue.addBulk.mockResolvedValueOnce(mockJobs);

      const jobs = [
        {
          name: 'job1',
          data: { testData: 'test1' },
          jobOptions: { delay: 1000 },
        },
        { name: 'job2', data: { testData: 'test2' } },
      ];

      const result = await queue.addBulkJob(jobs);

      expect(mockQueue.addBulk).toHaveBeenCalledWith([
        { name: 'job1', data: { testData: 'test1' }, opts: { delay: 1000 } },
        { name: 'job2', data: { testData: 'test2' }, opts: undefined },
      ]);
      expect(result).toHaveLength(2);
      expect(loggerMock.info).toHaveBeenCalled();
    });

    it('should throw QueueError when adding bulk jobs fails', async () => {
      mockQueue.addBulk.mockRejectedValueOnce(
        new Error('Add bulk jobs failed'),
      );

      const jobs = [
        { name: 'job1', data: { testData: 'test1' } },
        { name: 'job2', data: { testData: 'test2' } },
      ];

      await expect(queue.addBulkJob(jobs)).rejects.toThrow(QueueError);
    });
  });

  describe('getJob', () => {
    beforeEach(async () => {
      await queue.initQueue(mockQueueOptions);
      jest.clearAllMocks();
    });

    it('should retrieve a job by ID', async () => {
      const mockJob = { id: 'job123' } as unknown as Job;
      mockQueue.getJob.mockResolvedValueOnce(mockJob);

      const job = await queue.getJob('job123');

      expect(mockQueue.getJob).toHaveBeenCalledWith('job123');
      expect(job).toBe(mockJob);
      expect(loggerMock.debug).toHaveBeenCalled();
    });

    it('should return null when job is not found', async () => {
      mockQueue.getJob.mockResolvedValueOnce(null);

      const job = await queue.getJob('nonexistent');

      expect(job).toBeNull();
      expect(loggerMock.warn).toHaveBeenCalled();
    });

    it('should return null when QueueError is thrown', async () => {
      mockQueue.getJob.mockImplementationOnce(() => {
        throw new QueueError('Test error');
      });

      const job = await queue.getJob('job123');

      expect(job).toBeNull();
    });
  });

  describe('removeJob', () => {
    beforeEach(async () => {
      await queue.initQueue(mockQueueOptions);
      jest.clearAllMocks();
    });

    it('should remove a job by ID', async () => {
      const mockJob = {
        id: 'job123',
        remove: jest.fn().mockResolvedValueOnce(undefined),
      } as unknown as Job;
      mockQueue.getJob.mockResolvedValueOnce(mockJob);

      const result = await queue.removeJob('job123');

      expect(mockQueue.getJob).toHaveBeenCalledWith('job123');
      expect(mockJob.remove).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(loggerMock.info).toHaveBeenCalled();
    });

    it('should return false when job is not found', async () => {
      mockQueue.getJob.mockResolvedValueOnce(null);

      const result = await queue.removeJob('nonexistent');

      expect(result).toBe(false);
      expect(loggerMock.warn).toHaveBeenCalled();
    });
  });

  describe('pause and resume', () => {
    beforeEach(async () => {
      await queue.initQueue(mockQueueOptions);
      jest.clearAllMocks();
    });

    it('should pause the queue', async () => {
      mockQueue.pause.mockResolvedValueOnce(undefined);

      const result = await queue.pause();

      expect(mockQueue.pause).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(loggerMock.info).toHaveBeenCalled();
    });

    it('should resume the queue', async () => {
      mockQueue.resume.mockResolvedValueOnce(undefined);

      const result = await queue.resume();

      expect(mockQueue.resume).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(loggerMock.info).toHaveBeenCalled();
    });
  });

  describe('clean', () => {
    beforeEach(async () => {
      await queue.initQueue(mockQueueOptions);
      jest.clearAllMocks();
    });

    it('should clean jobs from the queue', async () => {
      mockQueue.clean.mockResolvedValueOnce(['job1', 'job2']);

      const result = await queue.clean(1000, 100);

      expect(mockQueue.clean).toHaveBeenCalledWith(1000, 100);
      expect(result).toBe(2);
      expect(loggerMock.info).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    beforeEach(async () => {
      await queue.initQueue(mockQueueOptions);
      jest.clearAllMocks();
    });

    it('should close the queue and events', async () => {
      mockQueue.close.mockResolvedValueOnce(undefined);
      mockQueueEvents.close.mockResolvedValueOnce(undefined);

      const result = await queue.close();

      expect(mockQueue.close).toHaveBeenCalled();
      expect(mockQueueEvents.close).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(loggerMock.info).toHaveBeenCalled();
    });

    it('should throw QueueError when closing fails', async () => {
      mockQueue.close.mockRejectedValueOnce(new Error('Close failed'));

      await expect(queue.close()).rejects.toThrow(QueueError);
      expect(loggerMock.error).toHaveBeenCalled();
    });

    it('should return true when queue is not initialized', async () => {
      // Create a new queue that hasn't been initialized
      const uninitializedQueue = new TestQueue(loggerMock);

      const result = await uninitializedQueue.close();

      expect(result).toBe(true);
    });
  });
});
