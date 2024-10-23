import { FastifyRequest, FastifyReply } from 'fastify';
import { LoggerOptions } from 'pino';
import { Environment } from 'src/global/types/environment.types';

const developmentLogger: LoggerOptions = {
  level: 'debug',
  serializers: {
    req(request: FastifyRequest) {
      const { url, method } = request;
      return { url, method };
    },
    res(reply: FastifyReply) {
      const { statusCode, sent } = reply;
      return { statusCode, sent };
    },
  },
  transport: {
    target: 'pino-pretty',
  },
};

const stagingLogger: LoggerOptions = {
  level: 'info',
  serializers: {
    req(request: FastifyRequest) {
      const { url, method, headers } = request;
      return { url, method, headers };
    },
    res(reply: FastifyReply) {
      const { statusCode, sent } = reply;
      return { statusCode, sent };
    },
  },
  transport: {
    target: 'pino-pretty',
    options: {
      singleLine: true,
    },
  },
};

const productionLogger: LoggerOptions = {
  level: 'info',
  serializers: {
    req(request: FastifyRequest) {
      const { url, method } = request;
      return { url, method };
    },
    res(reply: FastifyReply) {
      const { statusCode, sent } = reply;
      return { statusCode, sent };
    },
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers["service-token"]'],
    remove: false,
  },
  transport: {
    target: 'pino-pretty',
    options: {
      singleLine: true,
    },
  },
};

export const LoggerConfig: Record<Environment, LoggerOptions> = {
  [Environment.DEVELOPMENT]: developmentLogger,
  [Environment.STAGING]: stagingLogger,
  [Environment.PRODUCTION]: productionLogger,
};
