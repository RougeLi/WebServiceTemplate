import { requestContext } from '@fastify/request-context';
import { FastifyBaseLogger } from 'fastify/types/logger';
import { LogLevels } from 'src/core/constants';

export default class LoggerService {
  private logger: FastifyBaseLogger;

  constructor() {
    this.logger = {} as unknown as FastifyBaseLogger;
  }

  init(logger: FastifyBaseLogger) {
    this.logger = logger;
  }

  trace(message: string, ...arguments_: unknown[]) {
    this.log(LogLevels.TRACE, message, ...arguments_);
  }

  debug(message: string, ...arguments_: unknown[]) {
    this.log(LogLevels.DEBUG, message, ...arguments_);
  }

  info(message: string, ...arguments_: unknown[]) {
    this.log(LogLevels.INFO, message, ...arguments_);
  }

  warn(message: string, ...arguments_: unknown[]) {
    this.log(LogLevels.WARN, message, ...arguments_);
  }

  error(message: string, ...arguments_: unknown[]) {
    this.log(LogLevels.ERROR, message, ...arguments_);
  }

  fatal(message: string, ...arguments_: unknown[]) {
    this.log(LogLevels.FATAL, message, ...arguments_);
  }

  /**
   * Generic log method to reduce code repetition
   */
  private log(level: LogLevels, message: string, ...arguments_: unknown[]) {
    const logger = this.getLoggerInstance();
    logger[level](message, ...arguments_);
  }

  /**
   * Returns logger instance from request context or default logger
   */
  private getLoggerInstance(): FastifyBaseLogger {
    return requestContext.get('logger') ?? this.logger;
  }
}
