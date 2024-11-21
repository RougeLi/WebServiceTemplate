import { StatusCodes } from 'http-status-codes';
import { WebError } from 'src/core/utils';

export class UnauthorizedError extends WebError {
  constructor(message: string) {
    super(StatusCodes.UNAUTHORIZED, message);
  }
}
