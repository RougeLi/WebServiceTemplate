import { requestContext } from '@fastify/request-context';
import { FastifyBaseLogger } from 'fastify/types/logger';
import { LogLevels } from 'src/core/constants';
import { ILoggerService } from 'src/core/types';

const OBJECT_STRING = 'object';
const STRING_STRING = 'string';

export default class LoggerService implements ILoggerService {
  private logger: FastifyBaseLogger;

  constructor() {
    this.logger = {} as unknown as FastifyBaseLogger;
  }

  init(logger: FastifyBaseLogger) {
    this.logger = logger;
  }

  trace(...argumentsArray: any[]) {
    this.log(LogLevels.TRACE, ...argumentsArray);
  }

  debug(...argumentsArray: any[]) {
    this.log(LogLevels.DEBUG, ...argumentsArray);
  }

  info(...argumentsArray: any[]) {
    this.log(LogLevels.INFO, ...argumentsArray);
  }

  warn(...argumentsArray: any[]) {
    this.log(LogLevels.WARN, ...argumentsArray);
  }

  error(...argumentsArray: any[]) {
    this.log(LogLevels.ERROR, ...argumentsArray);
  }

  fatal(...argumentsArray: any[]) {
    this.log(LogLevels.FATAL, ...argumentsArray);
  }

  private log(level: LogLevels, ...argumentsArray: any[]) {
    const loggerInstance = this.getLoggerInstance();

    if (argumentsArray.length === 0) {
      return;
    }

    const [firstArgument, secondArgument, ...remainingArguments] =
      argumentsArray;

    if (firstArgument && typeof firstArgument === OBJECT_STRING) {
      const objectParam = firstArgument as Record<string, unknown>;
      if (typeof secondArgument === STRING_STRING) {
        loggerInstance[level](
          objectParam,
          secondArgument,
          ...remainingArguments,
        );
      } else {
        const filteredArguments = [
          secondArgument,
          ...remainingArguments,
        ].filter((value) => value !== undefined);
        const merged =
          filteredArguments.length > 0
            ? filteredArguments.map(serializeLogArgument).join(' ')
            : '';
        loggerInstance[level](objectParam, merged);
      }
    } else {
      const mergedMsg = argumentsArray.map(serializeLogArgument).join(' ');
      loggerInstance[level](mergedMsg);
    }
  }

  private getLoggerInstance(): FastifyBaseLogger {
    return requestContext.get('logger') ?? this.logger;
  }
}

function serializeLogArgument(argument: any): string {
  if (argument instanceof Error) {
    return `${argument.message} ${argument.stack ?? ''}`;
  }
  if (typeof argument === 'object') {
    try {
      return JSON.stringify(argument);
    } catch {
      return '[Circular Object]';
    }
  }
  return String(argument);
}
