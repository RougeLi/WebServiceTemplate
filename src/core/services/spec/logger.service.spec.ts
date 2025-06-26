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
      expect(mockLogger.info).toHaveBeenCalledWith(obj, '');
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
      // When the second argument is a string, all arguments are passed separately
      expect(mockLogger.info).toHaveBeenCalledWith(
        obj,
        'User login action',
        'extra1',
        'extra2',
      );
    });

    it('should filter out undefined arguments after object parameter and join remaining args', () => {
      const obj = { key: 'value' };
      service.info(obj, undefined, 'some other arg');
      // With the new implementation, the remaining arguments are joined as a string
      expect(mockLogger.info).toHaveBeenCalledWith(obj, 'some other arg');
    });

    it('should convert non-object, non-string first arguments to string', () => {
      const numberVal = 123;
      service.info(numberVal);
      expect(mockLogger.info).toHaveBeenCalledWith('123');
    });

    it('should join multiple non-object arguments with spaces', () => {
      service.info('Hello', 'world', 123);
      expect(mockLogger.info).toHaveBeenCalledWith('Hello world 123');
    });

    it('should pass multiple arguments after object separately', () => {
      const obj = { key: 'value' };
      service.info(obj, 'arg1', 'arg2', 123);
      expect(mockLogger.info).toHaveBeenCalledWith(obj, 'arg1', 'arg2', 123);
    });
  });

  describe('LoggerService with error arguments', () => {
    it('should handle Error object properly', () => {
      const error = new Error('Test error');
      service.error(error);
      // Error objects are treated as object parameters
      expect(mockLogger.error).toHaveBeenCalledWith(error, '');
    });

    it('should handle Error object and a message', () => {
      const error = new Error('Test error with message');
      const message = 'An error occurred';
      service.error(error, message);
      // When the second argument is a string, it's passed separately
      expect(mockLogger.error).toHaveBeenCalledWith(error, message);
    });
  });

  describe('serializeLogArgument function', () => {
    it('should convert objects to JSON strings', () => {
      const obj = { key: 'value', num: 123 };
      service.info(obj);
      expect(mockLogger.info).toHaveBeenCalledWith(obj, '');
    });

    it('should handle circular references in objects', () => {
      const circularObj: any = { key: 'value' };
      circularObj.self = circularObj;

      service.info(circularObj);
      // When serializing fails due to circular reference, it should use fallback
      expect(mockLogger.info).toHaveBeenCalledWith(circularObj, '');
    });

    it('should serialize nested objects in non-object first parameter case', () => {
      const nestedObj = { nested: { key: 'value' } };
      service.info('Message with object:', nestedObj);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Message with object: ${JSON.stringify(nestedObj)}`,
      );
    });

    it('should handle empty array of filtered arguments after object parameter', () => {
      const obj = { key: 'value' };
      service.info(obj, undefined);
      // With no remaining arguments after filtering, it should pass an empty string
      expect(mockLogger.info).toHaveBeenCalledWith(obj, '');
    });

    it('should properly serialize Error objects with message and stack', () => {
      const error = new Error('Test error');
      error.stack = 'Stack trace';
      service.info('Error occurred:', error);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Error occurred: Test error Stack trace',
      );
    });

    it('should handle Error objects without stack', () => {
      const error = new Error('Test error');
      error.stack = undefined;
      service.info('Error occurred:', error);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Error occurred: Test error ',
      );
    });

    it('should handle circular objects by returning [Circular Object]', () => {
      const circularObj: any = { key: 'value' };
      circularObj.self = circularObj;

      // Mock JSON.stringify to throw an error to trigger the catch block
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockImplementation(() => {
        throw new Error('Circular structure');
      });

      service.info('Circular object:', circularObj);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Circular object: [Circular Object]',
      );

      // Restore original JSON.stringify
      JSON.stringify = originalStringify;
    });
  });
});
