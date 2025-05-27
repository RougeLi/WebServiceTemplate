import { Job, Worker } from 'bullmq';
import { WorkerError } from '../../server';
import { LoggerService } from '../../services';
import { JobHandler } from '../../types';
import { BaseWorker } from '../base.worker';

// Mock implementation of BaseWorker for testing
class TestWorker extends BaseWorker {
  constructor(logger: LoggerService) {
    super(logger, 'test-worker');
  }

  // Expose protected methods for testing
  public exposeRegisterJobHandler(name: string, handler: JobHandler): void {
    this.registerJobHandler(name, handler);
  }

  // Expose private process method for testing
  public async exposeProcess(job: Job): Promise<any> {
    return (this as any).process(job);
  }

  // Override protected methods for testing
  protected registerDefaultHandlers(): void {
    this.registerJobHandler('default-job', async () => {
      return 'default-job-result';
    });
  }
}

// Mock Worker
jest.mock('bullmq', () => {
  const originalModule = jest.requireActual('bullmq');

  // Mock Worker class
  const mockWorker = {
    on: jest.fn(),
    close: jest.fn(),
  };

  return {
    ...originalModule,
    Worker: jest.fn(() => mockWorker),
  };
});

describe('BaseWorker', () => {
  let worker: TestWorker;
  let loggerMock: jest.Mocked<LoggerService>;
  let mockWorker: jest.Mocked<Worker>;
  // Define mock queue options with the required connection property
  const mockWorkerOptions = {
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

    // Create worker instance
    worker = new TestWorker(loggerMock);

    // Get mock instances directly from the mock implementation
    mockWorker = {
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Worker>;

    // Override the mock implementations to return our instances
    (Worker as unknown as jest.Mock).mockImplementation(() => mockWorker);
  });

  describe('constructor', () => {
    it('should register default handlers', () => {
      // The constructor calls registerDefaultHandlers
      const testWorker = new TestWorker(loggerMock);

      // Create a job to test with
      const mockJob = {
        name: 'default-job',
        id: 'job123',
      } as unknown as Job;

      // Test that the default handler was registered
      testWorker.exposeProcess(mockJob);

      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Processing Job job123 (default-job)'),
      );
    });
  });

  describe('registerJobHandler', () => {
    it('should register a new job handler', async () => {
      const handler = jest.fn().mockResolvedValue('test-result');
      worker.exposeRegisterJobHandler('test-job', handler);

      // Create a job to test with
      const mockJob = {
        name: 'test-job',
        id: 'job123',
      } as unknown as Job;

      // Test that the handler was registered
      await worker.exposeProcess(mockJob);

      expect(handler).toHaveBeenCalledWith(mockJob);
    });

    it('should log a warning when overwriting an existing handler', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      worker.exposeRegisterJobHandler('test-job', handler1);
      worker.exposeRegisterJobHandler('test-job', handler2);

      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining('Overwriting handler for job "test-job"'),
      );
    });
  });

  describe('initWorker', () => {
    it('should initialize the worker', async () => {
      await worker.initWorker(mockWorkerOptions);

      expect(Worker).toHaveBeenCalledWith(
        'test-worker',
        expect.any(Function),
        mockWorkerOptions,
      );
      expect(mockWorker.on).toHaveBeenCalledTimes(3); // completed, failed, error
      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Worker ready'),
      );
    });

    it('should not reinitialize if worker already exists', async () => {
      // Initialize once
      await worker.initWorker(mockWorkerOptions);
      jest.clearAllMocks();

      // Try to initialize again
      await worker.initWorker(mockWorkerOptions);

      // Should not create a new Worker
      expect(Worker).not.toHaveBeenCalled();
    });

    it('should throw WorkerError when initialization fails', async () => {
      // Mock Worker constructor to throw an error
      (Worker as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      await expect(worker.initWorker(mockWorkerOptions)).rejects.toThrow(
        WorkerError,
      );
      expect(loggerMock.error).toHaveBeenCalled();
    });
  });

  describe('process', () => {
    it('should process a job with a registered handler', async () => {
      const handler = jest.fn().mockResolvedValue('test-result');
      worker.exposeRegisterJobHandler('test-job', handler);

      const mockJob = {
        name: 'test-job',
        id: 'job123',
      } as unknown as Job;

      const result = await worker.exposeProcess(mockJob);

      expect(handler).toHaveBeenCalledWith(mockJob);
      expect(result).toBe('test-result');
      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Processing Job job123 (test-job)'),
      );
    });

    it('should throw a WorkerError when no handler is registered for the job', async () => {
      const mockJob = {
        name: 'unknown-job',
        id: 'job123',
      } as unknown as Job;

      await expect(worker.exposeProcess(mockJob)).rejects.toThrow(WorkerError);
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.stringContaining('No handler registered for job "unknown-job"'),
      );
    });

    it('should throw a WorkerError when the handler throws an error', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));
      worker.exposeRegisterJobHandler('test-job', handler);

      const mockJob = {
        name: 'test-job',
        id: 'job123',
      } as unknown as Job;

      await expect(worker.exposeProcess(mockJob)).rejects.toThrow(WorkerError);
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in handler test-job: Handler error'),
      );
    });
  });

  describe('close', () => {
    beforeEach(async () => {
      await worker.initWorker(mockWorkerOptions);
      jest.clearAllMocks();
    });

    it('should close the worker', async () => {
      mockWorker.close.mockResolvedValueOnce(undefined);

      await worker.close();

      expect(mockWorker.close).toHaveBeenCalled();
      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Worker closed'),
      );
    });

    it('should do nothing if worker is not initialized', async () => {
      // Create a new worker that hasn't been initialized
      const uninitializedWorker = new TestWorker(loggerMock);

      await uninitializedWorker.close();

      expect(mockWorker.close).not.toHaveBeenCalled();
    });
  });
});
