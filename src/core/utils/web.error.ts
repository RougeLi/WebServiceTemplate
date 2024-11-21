import { StatusCodes } from 'http-status-codes';

export default class WebError extends Error {
  public readonly statusCodes: number;
  public readonly message: string;

  constructor(statusCodes: StatusCodes, message: string) {
    super(message);
    this.statusCodes = statusCodes;
    this.message = message;
    Error.captureStackTrace(this, this.constructor);
  }
}
