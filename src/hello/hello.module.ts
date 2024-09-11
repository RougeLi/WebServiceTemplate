import { InjectionResolverMode } from 'src/global/types/framework.types';
import { BaseModule } from 'src/global/utils/base.module';
import { HelloController } from './controllers/hello.controller';
import { HelloRoute } from './routes/hello.route';
import { HelloService } from './services/hello.service';
import { InjectionTokens } from './types/hello.types';

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
      );
  }
}
