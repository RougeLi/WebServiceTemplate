import { requestContext } from '@fastify/request-context';
import { FastifyBaseLogger } from 'fastify/types/logger';
import LoggerService from '../logger.service';

jest.mock('@fastify/request-context', () => ({
  requestContext: {
    get: jest.fn(),
  },
}));

describe('LoggerService', () => {
  let service: LoggerService;
  let mockLogger: FastifyBaseLogger;

  beforeEach(() => {
    service = new LoggerService();
    mockLogger = {
      trace: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
    } as unknown as FastifyBaseLogger;
    service.init(mockLogger);
    jest.clearAllMocks();
  });

  describe('init', () => {
    it('should accept logger lib and initialize it', () => {
      service.trace('test');
      expect(mockLogger.trace).toHaveBeenCalledWith('test');
    });
  });

  describe('log methods', () => {
    it('should call trace method on logger', () => {
      service.trace('trace message');
      expect(mockLogger.trace).toHaveBeenCalledWith('trace message');
    });

    it('should call debug method on logger', () => {
      service.debug('debug message');
      expect(mockLogger.debug).toHaveBeenCalledWith('debug message');
    });

    it('should call info method on logger', () => {
      service.info('info message');
      expect(mockLogger.info).toHaveBeenCalledWith('info message');
    });

    it('should call warn method on logger', () => {
      service.warn('warn message');
      expect(mockLogger.warn).toHaveBeenCalledWith('warn message');
    });

    it('should call error method on logger', () => {
      service.error('error message');
      expect(mockLogger.error).toHaveBeenCalledWith('error message');
    });

    it('should call fatal method on logger', () => {
      service.fatal('fatal message');
      expect(mockLogger.fatal).toHaveBeenCalledWith('fatal message');
    });
  });

  describe('getLoggerInstance', () => {
    it('should return the logger from the request context if present', () => {
      const contextLogger = {
        trace: jest.fn(),
      } as unknown as FastifyBaseLogger;
      (requestContext.get as jest.Mock).mockReturnValue(contextLogger);

      const loggerInstance = service['getLoggerInstance']();
      expect(loggerInstance).toBe(contextLogger);
    });

    it('should return the default logger if no logger in context', () => {
      const mockValue = undefined;
      (requestContext.get as jest.Mock).mockReturnValue(mockValue);

      const loggerInstance = service['getLoggerInstance']();
      expect(loggerInstance).toBe(mockLogger);
    });
  });

  describe('empty arguments', () => {
    it('should return early if no arguments are provided', () => {
      service.info();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('LoggerService with object arguments', () => {
    it('should handle object as first parameter', () => {
      const obj = { userId: 123, action: 'login' };
      service.info(obj);
      expect(mockLogger.info).toHaveBeenCalledWith(obj);
    });

    it('should handle object as first parameter and a string message as second parameter', () => {
      const obj = { userId: 123, action: 'login' };
      const message = 'User login action';
      service.info(obj, message);
      expect(mockLogger.info).toHaveBeenCalledWith(obj, message);
    });

    it('should handle object as first parameter and multiple extra arguments', () => {
      const obj = { userId: 123, action: 'login' };
      service.info(obj, 'User login action', 'extra1', 'extra2');
      expect(mockLogger.info).toHaveBeenCalledWith(
        obj,
        'User login action',
        'extra1',
        'extra2',
      );
    });

    it('should filter out undefined arguments after object parameter', () => {
      const obj = { key: 'value' };
      service.info(obj, undefined, 'some other arg');
      // 預期不會有undefined傳入logger，filteredArguments應該只會留有 'some other arg'
      expect(mockLogger.info).toHaveBeenCalledWith(obj, 'some other arg');
    });

    it('should convert non-object, non-string first arguments to string', () => {
      const numberVal = 123;
      service.info(numberVal);
      expect(mockLogger.info).toHaveBeenCalledWith('123');
    });
  });

  describe('LoggerService with error arguments', () => {
    it('should handle Error object properly', () => {
      const error = new Error('Test error');
      service.error(error);
      expect(mockLogger.error).toHaveBeenCalledWith(error);
    });

    it('should handle Error object and a message', () => {
      const error = new Error('Test error with message');
      const message = 'An error occurred';
      service.error(error, message);
      expect(mockLogger.error).toHaveBeenCalledWith(error, message);
    });
  });
});
