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
      const { id, url, method, host } = request;
      return { id, url, method, host };
    },
    res(reply: FastifyReply) {
      const { statusCode, sent, request } = reply;
      const { url, method, params, query, body, headers, hostname } = request;
      return {
        statusCode,
        sent,
        url,
        method,
        params,
        query,
        body,
        headers,
        hostname,
      };
    },
  },
  redact: {
    paths: ['req.headers.authorization'],
    remove: false,
  },
};

const productionLogger: LoggerOptions = {
  level: 'info',
  serializers: {
    req(request: FastifyRequest) {
      const { id, url, method, hostname } = request;
      return { id, url, method, hostname };
    },
    res(reply: FastifyReply) {
      const { statusCode, sent, request } = reply;
      const { url, method, params, query, body, headers, hostname } = request;
      return {
        statusCode,
        sent,
        url,
        method,
        params,
        query,
        body,
        headers,
        hostname,
      };
    },
  },
  redact: {
    paths: ['req.headers.authorization'],
    remove: false,
  },
};

export const LoggerConfig: Record<Environment, LoggerOptions> = {
  [Environment.DEVELOPMENT]: developmentLogger,
  [Environment.STAGING]: stagingLogger,
  [Environment.PRODUCTION]: productionLogger,
};
