import { FastifyReply } from 'fastify';
import { StatusCodes } from 'http-status-codes';
import { WebError } from 'src/core/utils';

export class ReplyHandler {
  private readonly INTERNAL_ERROR_MESSAGE = 'Internal server error';

  handle(reply: FastifyReply, error: WebError) {
    const payload = this.createErrorPayload(error.message);
    reply.code(error.statusCodes).send(payload);
  }

  handleInternalError(reply: FastifyReply) {
    const internalErrorPayload = this.createErrorPayload(
      this.INTERNAL_ERROR_MESSAGE,
    );
    reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send(internalErrorPayload);
  }

  private createErrorPayload(message: string) {
    return { message };
  }
}
