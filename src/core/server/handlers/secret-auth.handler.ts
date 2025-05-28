import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from 'src/core/server/errors';
import { EnvironmentService, LoggerService } from 'src/core/services';
import { AuthStrategy } from '../types';

export default class SecretAuthHandler implements AuthStrategy {
  private readonly SERVICE_AUTH_NAME;
  private readonly SECRET_KEY;

  constructor(
    readonly environment: EnvironmentService,
    private readonly logger: LoggerService,
  ) {
    const { serviceAuthName, secretKey } = environment.getConfig();
    this.SERVICE_AUTH_NAME = serviceAuthName;
    this.SECRET_KEY = secretKey;
  }

  /** Secret key authentication middleware for inter-service requests validation */
  authorizeMiddleware = async (
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> => {
    const secretKey = request.headers[this.SERVICE_AUTH_NAME];
    const url = request.url;

    if (this.validateSecretKey(secretKey)) {
      this.logger.debug(`PreHandler: authorizeMiddleware for ${url} SUCCESS`);
      return;
    }

    this.logger.info(`PreHandler: authorizeMiddleware for ${url} FAILED`);
    throw new UnauthorizedError('Unauthorized');
  };

  validateSecretKey(secretKey: any): boolean {
    return secretKey === this.SECRET_KEY;
  }
}
