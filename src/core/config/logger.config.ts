import { FastifyRequest, FastifyReply } from 'fastify';
import { LoggerOptions } from 'pino';
import { Environment } from 'src/core/constants';

const developmentLogger: LoggerOptions = {
  level: 'debug',
  serializers: {
    req(request: FastifyRequest) {
      const { url, method } = request;
      return { url, method };
    },
    res(reply: FastifyReply) {
      const { statusCode, sent, request } = reply;
      const { params, query, body } = request;
      return { statusCode, sent, params, query, body };
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
      const { url, method, ip, headers } = request;
      return { url, method, ip, headers };
    },
    res(reply: FastifyReply) {
      const { statusCode, sent, request } = reply;
      const { params, query, body } = request;
      return { statusCode, sent, params, query, body };
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
      const { url, method, ip } = request;
      return { url, method, ip };
    },
    res(reply: FastifyReply) {
      const { statusCode, sent, request } = reply;
      const { params, query, body } = request;
      return { statusCode, sent, params, query, body };
    },
  },
  redact: {
    paths: ['req.headers.authorization'],
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
