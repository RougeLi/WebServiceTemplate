import { StatusCodes } from 'http-status-codes';
import WebError from './web.error';

export class UnauthorizedError extends WebError {
  constructor(message: string) {
    super(StatusCodes.UNAUTHORIZED, message);
  }
}
