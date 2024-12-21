import { LoggerService } from 'src/core/services';
import {
  CustomPrismaClient,
  PrismaLogLevels,
  PrismaQueryEvent,
} from 'src/core/types';
import DbUtils, { formatQueryEvent } from '../db-utils';

describe('DbUtils', () => {
  let loggerMock: jest.Mocked<LoggerService>;
  let prismaMock: jest.Mocked<CustomPrismaClient>;

  beforeEach(() => {
    loggerMock = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    prismaMock = {
      $on: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    } as unknown as jest.Mocked<CustomPrismaClient>;
  });

  describe('setupLogging', () => {
    it('should setup query logging when log level includes "query"', () => {
      const logLevels: PrismaLogLevels = ['query'];
      DbUtils.setupLogging(loggerMock, logLevels, prismaMock);
      expect(prismaMock.$on).toHaveBeenCalledWith(
        'query',
        expect.any(Function),
      );
    });

    it('should setup info logging when log level includes "info"', () => {
      const logLevels: PrismaLogLevels = ['info'];
      DbUtils.setupLogging(loggerMock, logLevels, prismaMock);
      expect(prismaMock.$on).toHaveBeenCalledWith('info', expect.any(Function));
    });

    it('should setup warn logging when log level includes "warn"', () => {
      const logLevels: PrismaLogLevels = ['warn'];
      DbUtils.setupLogging(loggerMock, logLevels, prismaMock);
      expect(prismaMock.$on).toHaveBeenCalledWith('warn', expect.any(Function));
    });

    it('should setup error logging when log level includes "error"', () => {
      const logLevels: PrismaLogLevels = ['error'];
      DbUtils.setupLogging(loggerMock, logLevels, prismaMock);
      expect(prismaMock.$on).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
      );
    });
  });

  describe('formatQueryEvent', () => {
    const callFormat = (
      event: PrismaQueryEvent,
      maxStringLength = 1000,
      enableJsonParse = true,
    ): string => {
      const formatter = formatQueryEvent(maxStringLength, enableJsonParse);
      return formatter(event);
    };

    it('should format the query event with normal JSON string (enableJsonParse = true)', () => {
      const event: PrismaQueryEvent = {
        timestamp: new Date(),
        query: 'SELECT * FROM users',
        params: JSON.stringify({ foo: 'bar' }),
        duration: 123,
        target: 'db',
      };

      const result = callFormat(event);
      expect(result).toContain('Query executed in 123 ms:');
      expect(result).toContain('SELECT * FROM users');
      expect(result).toContain('Params:');
      expect(result).toContain('"foo": "bar"');
    });

    it('should format the query event with invalid JSON string (enableJsonParse = true)', () => {
      const event: PrismaQueryEvent = {
        timestamp: new Date(),
        query: 'UPDATE users',
        params: '{badJSON:',
        duration: 50,
        target: 'db',
      };

      const result = callFormat(event);
      expect(result).toContain('Query executed in 50 ms:');
      expect(result).toContain('UPDATE users');
      expect(result).toContain('Params: {badJSON:');
      expect(result).not.toContain('... (truncated)');
    });

    it('should format the query event without attempting JSON parse (enableJsonParse = false)', () => {
      const event: PrismaQueryEvent = {
        timestamp: new Date(),
        query: 'INSERT INTO table',
        params: '{"foo":"bar","baz":123}',
        duration: 10,
        target: 'db',
      };

      const result = callFormat(event, 1000, false);

      expect(result).toContain('Query executed in 10 ms:');
      expect(result).toContain('INSERT INTO table');
      expect(result).toContain('Params: {"foo":"bar","baz":123}');
    });

    it('should truncate very long JSON output when enableJsonParse = true', () => {
      const longStr = 'a'.repeat(1200);
      const event: PrismaQueryEvent = {
        timestamp: new Date(),
        query: 'SELECT big_column FROM table',
        params: JSON.stringify({ bigdata: longStr }),
        duration: 999,
        target: 'db',
      };

      const result = callFormat(event);

      expect(result).toContain('Query executed in 999 ms:');
      expect(result).toContain('SELECT big_column FROM table');
      expect(result).toContain('... (truncated)');
      expect(result.length).toBeLessThan(1200 + 100);
    });

    it('should truncate very long plain string when JSON parse fails or disabled', () => {
      const longStr = 'b'.repeat(1200);
      const event: PrismaQueryEvent = {
        timestamp: new Date(),
        query: 'DELETE FROM table',
        params: longStr,
        duration: 42,
        target: 'db',
      };

      const result = callFormat(event);

      expect(result).toContain('Query executed in 42 ms:');
      expect(result).toContain('DELETE FROM table');
      expect(result).toContain('... (truncated)');
    });
  });

  describe('getConnectMethod', () => {
    let connectMethod: () => Promise<void>;

    beforeEach(() => {
      connectMethod = DbUtils.getConnectMethod(loggerMock, prismaMock);
      jest.useFakeTimers();
      jest.spyOn(global, 'setTimeout');
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.clearAllMocks();
    });

    it('should connect on the first attempt successfully', async () => {
      prismaMock.$connect.mockResolvedValueOnce(undefined);

      const connectPromise = connectMethod();
      await connectPromise;

      expect(loggerMock.info).toHaveBeenCalledWith(
        'Connecting to the database...',
      );
      expect(prismaMock.$connect).toHaveBeenCalledTimes(1);
      expect(loggerMock.info).toHaveBeenCalledWith(
        'Database connection established.',
      );
    });

    it('should retry on failure and eventually succeed', async () => {
      prismaMock.$connect
        .mockRejectedValueOnce(new Error('Connection error #1'))
        .mockResolvedValueOnce(undefined);

      const connectPromise = connectMethod();

      // Wait for the promise queue
      await Promise.resolve();
      // Run the pending timers -> Simulate backoff time
      jest.runOnlyPendingTimers();
      await Promise.resolve();

      await connectPromise;

      expect(prismaMock.$connect).toHaveBeenCalledTimes(2);
      expect(loggerMock.info).toHaveBeenCalledWith(
        'Connecting to the database...',
      );
      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining('Attempt 1 failed: Connection error #1'),
      );
      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringMatching(/Waiting for \d+ ms before next attempt./),
      );
      expect(loggerMock.info).toHaveBeenCalledWith(
        'Database connection established.',
      );
    });

    it('should throw if authentication error is encountered', async () => {
      const authError = new Error('Authentication error');
      prismaMock.$connect.mockRejectedValueOnce(authError);

      await expect(connectMethod()).rejects.toThrow(authError);

      expect(loggerMock.info).toHaveBeenCalledWith(
        'Connecting to the database...',
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Failed to connect to the database due to authentication error.',
      );
      expect(prismaMock.$connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDisconnectMethod', () => {
    let disconnectMethod: () => Promise<void>;

    beforeEach(() => {
      disconnectMethod = DbUtils.getDisconnectMethod(loggerMock, prismaMock);
    });

    it('should disconnect from the database successfully', async () => {
      prismaMock.$disconnect.mockResolvedValueOnce(undefined);

      await disconnectMethod();

      expect(prismaMock.$disconnect).toHaveBeenCalled();
      expect(loggerMock.info).toHaveBeenCalledWith(
        'Disconnected from the database.',
      );
    });

    it('should log error if disconnect fails', async () => {
      const disconnectError = new Error('Disconnect failed');
      prismaMock.$disconnect.mockRejectedValueOnce(disconnectError);

      await expect(disconnectMethod()).rejects.toThrow('Disconnect failed');
      expect(loggerMock.error).toHaveBeenCalledWith(
        `Failed to disconnect from the database. Error: ${disconnectError.message}`,
      );
    });
  });
});
