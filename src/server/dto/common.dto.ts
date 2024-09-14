import { Type } from '@sinclair/typebox';
import { StatusCodes } from 'http-status-codes';

export const UnauthorizedResponse = Type.Object({
  message: Type.String({
    description:
      'Unauthorized access, typically returned when a valid authentication token is not provided.',
    examples: ['Unauthorized access, token missing or invalid.'],
  }),
});

export const NotFoundResponse = Type.Object({
  message: Type.String({
    description:
      'The requested resource could not be found, usually returned when an invalid path or resource ID is provided.',
    examples: ['Resource not found.'],
  }),
});

export const BadRequestResponse = Type.Object({
  message: Type.String({
    description:
      'The request was malformed, often due to invalid input or query parameters.',
    examples: ['Invalid request payload or parameters.'],
  }),
});

export const InternalServerErrorResponse = Type.Object({
  message: Type.Literal('Internal server error', {
    description:
      'A server-side error occurred, typically due to an unexpected condition on the server.',
    examples: ['Internal server error'],
  }),
});

export const CommonSchema = {
  [StatusCodes.UNAUTHORIZED]: UnauthorizedResponse,
  [StatusCodes.BAD_REQUEST]: BadRequestResponse,
  [StatusCodes.NOT_FOUND]: NotFoundResponse,
  [StatusCodes.INTERNAL_SERVER_ERROR]: InternalServerErrorResponse,
};
