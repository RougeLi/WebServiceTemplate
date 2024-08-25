import { LoggerOptions } from 'pino';
import { Environment } from 'src/global/types/environment.types';

const defaultLogger = {
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
};

export const LoggerConfig: Record<Environment, LoggerOptions> = {
  [Environment.DEVELOPMENT]: defaultLogger,
  [Environment.STAGING]: defaultLogger,
  [Environment.PRODUCTION]: defaultLogger,
};
