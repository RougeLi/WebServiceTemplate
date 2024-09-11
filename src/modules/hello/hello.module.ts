import { InjectionResolverMode } from 'src/core/constants';
import { BaseModule } from 'src/core/utils';
import { InjectionTokens } from './constants';
import { HelloController } from './controllers';
import HelloRoute from './hello.route';
import { HelloModel } from './model';
import { HelloService } from './services';

export default class HelloModule extends BaseModule {
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
