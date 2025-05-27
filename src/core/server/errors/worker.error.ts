import { StatusCodes } from 'http-status-codes';
import WebError from './web.error';

/**
 * Worker operation error type (preserves original cause)
 */
export class WorkerError extends WebError {
  /**
   * @param message - Error message
   * @param cause - Original error, if any
   */
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(StatusCodes.INTERNAL_SERVER_ERROR, message);
  }

  /**
   * Returns a detailed error message including internal cause information.
   */
  public getDetailedMessage(): string {
    let detailed = this.message;

    if (this.cause) {
      detailed += `\nCaused by: ${this.cause.message}`;

      if (
        this.cause &&
        'cause' in this.cause &&
        this.cause.cause instanceof Error
      ) {
        detailed += `\nOriginal cause: ${this.cause.cause.message}`;
      }
    }

    return detailed;
  }
}
