import { LoggerOptions } from 'pino';
import { Environment } from 'src/global/types/environment.types';

const developmentLogger: LoggerOptions = {
  level: 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
};

const stagingLogger: LoggerOptions = {
  level: 'info',
  formatters: {
    level(label) {
      return { level: label };
    },
  },
};

const productionLogger: LoggerOptions = {
  level: 'warn',
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  redact: ['req.headers.authorization'],
};

export const LoggerConfig: Record<Environment, LoggerOptions> = {
  [Environment.DEVELOPMENT]: developmentLogger,
  [Environment.STAGING]: stagingLogger,
  [Environment.PRODUCTION]: productionLogger,
};
