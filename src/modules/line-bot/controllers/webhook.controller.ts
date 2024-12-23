import { FastifyReply, FastifyRequest } from 'fastify';
import { StatusCodes } from 'http-status-codes';
import { LoggerService } from 'src/core/services';
import { WebhookService } from '../services';
import { WebhookRequestBody } from '../types';

export default class WebhookController {
  constructor(
    private readonly logger: LoggerService,
    private readonly webhookService: WebhookService,
  ) {}

  receiveWebhook = async (
    request: FastifyRequest<{
      Body: WebhookRequestBody;
    }>,
    reply: FastifyReply,
  ) => {
    const { body } = request;

    try {
      await this.webhookService.saveEventsToDatabase(body);
    } catch (error) {
      this.logger.error('Failed to save events to database', error);
      throw error;
    }

    reply.code(StatusCodes.OK).send();
  };
}
