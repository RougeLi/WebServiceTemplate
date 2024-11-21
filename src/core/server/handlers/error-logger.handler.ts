import { Environment } from 'src/core/constants';
import { EnvironmentService, LoggerService } from 'src/core/services';
import { AppConfigType } from 'src/core/types';
import { WebError } from 'src/core/utils';

export class ErrorLoggerHandler {
  private readonly config: AppConfigType;

  constructor(
    private readonly logger: LoggerService,
    private readonly environmentService: EnvironmentService,
  ) {
    this.config = this.environmentService.getConfig();
  }

  logError(error: WebError) {
    const formattedError = this.formatError(error);
    this.logger.error(formattedError);
  }

  internalError(error: Error) {
    this.logger.error(`${error.stack}`);
  }

  /**
   * Formats error messages based on the environment.
   * Development: more detailed stack trace and status code
   * Staging: concise info with status code
   * Production: only critical info
   */
  private formatError(error: WebError): string {
    switch (this.config.appEnv) {
      case Environment.DEVELOPMENT: {
        return [
          `Error: ${error.message}`,
          `Status Code: ${error.statusCodes}`,
          `Stack: ${error.stack}`,
        ]
          .filter(Boolean)
          .join('\n');
      }

      case Environment.STAGING: {
        return [
          `Error: ${error.message}`,
          `Status Code: ${error.statusCodes}`,
        ].join('\n');
      }

      case Environment.PRODUCTION: {
        return `Error: ${error.message}`;
      }

      default: {
        return `Error: ${error.message}`;
      }
    }
  }
}
