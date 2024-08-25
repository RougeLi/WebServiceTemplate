import { requestContext } from '@fastify/request-context';
import { FastifyBaseLogger } from 'fastify/types/logger';
import { LoggerService } from 'src/global/services/logger.service';

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
});
