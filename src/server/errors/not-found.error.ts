import { StatusCodes } from 'http-status-codes';
import { WebError } from '../web.error';

export class NotFoundError extends WebError {
  constructor(message: string) {
    super(StatusCodes.NOT_FOUND, message);
  }
}
