import { LoggerService } from 'src/core/services';
import { WebhookModel } from '../model';
import { WebhookRequestBody } from '../types';

export default class WebhookService {
  constructor(
    private readonly logger: LoggerService,
    private readonly webhookModel: WebhookModel,
  ) {}

  async saveEventsToDatabase(body: WebhookRequestBody) {
    this.logger.info('Received webhook event', body);
    const { events, destination } = body;

    try {
      await this.webhookModel.handleWebhook(destination, events);
    } catch (error) {
      this.logger.error('Failed to save events to database', error);
      throw error;
    }
  }
}
