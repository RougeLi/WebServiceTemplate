import { StatusCodes } from 'http-status-codes';
import { WebError } from 'src/core/utils';

export class NotFoundError extends WebError {
  constructor(message: string) {
    super(StatusCodes.NOT_FOUND, message);
  }
}
