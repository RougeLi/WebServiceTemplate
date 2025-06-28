import { StatusCodes } from 'http-status-codes';
import { Environment } from 'src/core/constants';
import { WebError } from 'src/core/server';
import { EnvironmentService, LoggerService } from 'src/core/services';
import { AppConfigType } from 'src/core/types';

export class ErrorLoggerHandler {
  private readonly config: AppConfigType;

  constructor(
    private readonly logger: LoggerService,
    private readonly environment: EnvironmentService,
  ) {
    this.config = this.environment.getConfig();
  }

  /** Log request errors or parameter validation errors as info level */
  logError(error: WebError) {
    const formattedError = this.formatError(error);
    this.logger.info(formattedError);
  }

  /** Log critical internal errors as error level */
  internalError(error: Error) {
    this.logger.error(error);
  }

  /** Format error message based on environment */
  private formatError(error: WebError): string {
    let prefix: string;
    if (
      error.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR &&
      error.statusCode < 600
    ) {
      prefix = 'Internal Server Error';
    } else if (
      error.statusCode >= StatusCodes.BAD_REQUEST &&
      error.statusCode < StatusCodes.INTERNAL_SERVER_ERROR
    ) {
      prefix = 'Client Request Error';
    } else {
      prefix = 'Application Notice';
    }

    switch (this.config.appEnv) {
      case Environment.DEVELOPMENT:
        return [
          `${prefix}: ${error.message}`,
          `Status Code: ${error.statusCode}`,
          `Stack: ${error.stack}`,
        ]
          .filter(Boolean)
          .join('\n');
      case Environment.STAGING:
        return [
          `${prefix}: ${error.message}`,
          `Status Code: ${error.statusCode}`,
        ].join('\n');
      case Environment.PRODUCTION:
      default:
        return `${prefix}: ${error.message}`;
    }
  }
}
