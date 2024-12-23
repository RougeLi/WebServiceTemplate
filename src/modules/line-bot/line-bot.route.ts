import { StatusCodes } from 'http-status-codes';
import { CommonSchema } from 'src/core/server';
import { WebServer } from 'src/core/types';
import { BaseRoute } from 'src/core/utils';
import { LineBotRoutes } from './constants';
import { WebhookController } from './controllers';
import { WebhookResponse } from './dto';

const WEBHOOK_TAG = 'webhook';

export default class LineBotRoute extends BaseRoute {
  constructor(private readonly webhookController: WebhookController) {
    super();
  }

  registerRoutes(webServer: WebServer) {
    webServer.post(
      LineBotRoutes.WEBHOOK,
      {
        schema: {
          response: {
            ...CommonSchema,
            [StatusCodes.OK]: WebhookResponse,
          },
          description: 'Webhook for LINE bot',
          summary: 'Webhook for LINE bot',
          tags: [WEBHOOK_TAG],
        },
      },
      this.webhookController.receiveWebhook,
    );
  }
}
