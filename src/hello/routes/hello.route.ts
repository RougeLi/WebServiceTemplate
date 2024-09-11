import { WebServer } from 'src/global/types/framework.types';
import { BaseRoute } from 'src/global/utils/base.route';
import { SayHelloSchema } from 'src/hello/dto/hello.dto';
import { Routes } from 'src/hello/types/hello.types';
import { HelloController } from '../controllers/hello.controller';

export class HelloRoute extends BaseRoute {
  constructor(private readonly helloController: HelloController) {
    super();
  }

  registerRoutes(webServer: WebServer) {
    webServer.get(
      Routes.HELLO,
      SayHelloSchema,
      this.helloController.sayHello.bind(this.helloController),
    );
  }
}
