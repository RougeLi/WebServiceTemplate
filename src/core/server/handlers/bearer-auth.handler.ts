import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '../errors';
import { AuthStrategy } from '../types';

type RoutePattern = { method: string; pattern: RegExp };

export default class BearerAuthHandler implements AuthStrategy {
  private readonly noAuthPatterns: RoutePattern[] = [];

  constructor() {}

  /** Dynamically register route without authentication */
  registerNoAuthRoute(method: string, pattern: RegExp) {
    this.noAuthPatterns.push({ method, pattern });
  }

  /** Fastify Pre-Handler Middleware for Authorization */
  authorizeMiddleware = async (
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> => {
    // 1. Check if the route requires no authentication
    const skipAuth = this.noAuthPatterns.some(
      (route) =>
        route.method === request.method && route.pattern.test(request.url),
    );
    if (skipAuth) return;

    // 2. JWT validation
    try {
      await request.jwtVerify();
    } catch {
      throw new UnauthorizedError('JWT is expired');
    }
  };
}
