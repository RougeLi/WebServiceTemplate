import { WebServer } from 'src/core/types';
import { BaseRoute } from 'src/core/utils';
import { HelloRoutes } from 'src/modules/hello/constants/hello-routes';
import { SayHelloSchema } from 'src/modules/hello/dto/hello.dto';
import { HelloController } from '../controllers/hello.controller';

export class HelloRoute extends BaseRoute {
  constructor(private readonly helloController: HelloController) {
    super();
  }

  registerRoutes(webServer: WebServer) {
    webServer.get(
      HelloRoutes.HELLO,
      SayHelloSchema,
      this.helloController.sayHello,
    );
  }
}
