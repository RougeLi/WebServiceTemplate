import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Common interface for all authentication strategies
 * This interface ensures that all authentication handlers have a consistent API
 */
export interface AuthStrategy {
  /**
   * Middleware function for authorization
   * @param request The Fastify request object
   * @param reply The Fastify reply object
   */
  authorizeMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void>;
}
