import { StatusCodes } from 'http-status-codes';
import { WebError } from '../web.error';

export class BadRequestError extends WebError {
  constructor(message: string) {
    super(StatusCodes.BAD_REQUEST, message);
  }
}
