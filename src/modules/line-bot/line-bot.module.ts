import { InjectionResolverMode } from 'src/core/constants';
import { BaseModule } from 'src/core/utils';
import { InjectionTokens } from './constants';
import { WebhookController } from './controllers';
import LineBotRoute from './line-bot.route';
import { WebhookModel } from './model';
import { WebhookService } from './services';

export default class LineBotModule extends BaseModule {
  registerDependencies() {
    this.registerDependency(
      InjectionTokens.LINE_BOT_ROUTE,
      LineBotRoute,
      InjectionResolverMode.SINGLETON,
    )
      .registerDependency(
        InjectionTokens.WEBHOOK_CONTROLLER,
        WebhookController,
        InjectionResolverMode.SINGLETON,
      )
      .registerDependency(
        InjectionTokens.WEBHOOK_SERVICE,
        WebhookService,
        InjectionResolverMode.SINGLETON,
      )
      .registerDependency(
        InjectionTokens.WEBHOOK_MODEL,
        WebhookModel,
        InjectionResolverMode.SINGLETON,
      );
  }
}
