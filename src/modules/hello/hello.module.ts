import { InjectionResolverMode } from 'src/core/constants';
import { BaseModule } from 'src/core/utils';
import { HelloModel } from 'src/modules/hello/model/hello.model';
import { InjectionTokens } from './constants/injection-tokens';
import { HelloController } from './controllers/hello.controller';
import { HelloRoute } from './routes/hello.route';
import { HelloService } from './services/hello.service';

export class HelloModule extends BaseModule {
  registerDependencies() {
    this.registerDependency(
      InjectionTokens.HELLO_ROUTE,
      HelloRoute,
      InjectionResolverMode.SINGLETON,
    )
      .registerDependency(
        InjectionTokens.HELLO_CONTROLLER,
        HelloController,
        InjectionResolverMode.SINGLETON,
      )
      .registerDependency(
        InjectionTokens.HELLO_SERVICE,
        HelloService,
        InjectionResolverMode.SINGLETON,
      )
      .registerDependency(
        InjectionTokens.HELLO_MODEL,
        HelloModel,
        InjectionResolverMode.SINGLETON,
      );
  }
}
