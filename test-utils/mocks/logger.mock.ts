import { FastifyBaseLogger } from 'fastify/types/logger';
import { LoggerService } from 'src/core/services';

export function getLoggerServiceMock() {
  const mockLogger: FastifyBaseLogger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  } as unknown as FastifyBaseLogger;

  const loggerService = new LoggerService();
  loggerService.init(mockLogger);

  return loggerService;
}
