import { FastifyError } from 'fastify';
import { StatusCodes } from 'http-status-codes';

export default class WebError extends Error implements FastifyError {
  public readonly code = 'WEB_ERROR';
  public readonly statusCode: number;
  public readonly message: string;

  constructor(statusCodes: StatusCodes, message: string) {
    super(message);
    this.statusCode = statusCodes;
    this.message = message;
    Error.captureStackTrace(this, this.constructor);
  }
}
