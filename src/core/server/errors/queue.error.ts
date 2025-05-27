import { StatusCodes } from 'http-status-codes';
import WebError from './web.error';

/**
 * Queue operation error type (preserves original cause)
 */
export class QueueError extends WebError {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(StatusCodes.INTERNAL_SERVER_ERROR, message);
  }

  getDetailedMessage(): string {
    let message = this.message;

    if (this.cause) {
      message += `\nCaused by: ${this.cause.message}`;

      if ('cause' in this.cause && this.cause.cause instanceof Error) {
        const innerError = this.cause.cause as Error;
        message += `\nOriginal cause: ${innerError.message}`;
      }
    }

    return message;
  }
}
