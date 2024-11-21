import { FastifyBaseLogger } from 'fastify/types/logger';

declare module '@fastify/request-context' {
  // noinspection JSUnusedGlobalSymbols
  interface RequestContextData {
    logger: FastifyBaseLogger;
  }
}
