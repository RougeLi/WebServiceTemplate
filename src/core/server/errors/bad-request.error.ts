import { StatusCodes } from 'http-status-codes';
import { WebError } from 'src/core/utils';

export class BadRequestError extends WebError {
  constructor(message: string) {
    super(StatusCodes.BAD_REQUEST, message);
  }
}
