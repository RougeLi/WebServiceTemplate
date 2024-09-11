import { WebServer } from 'src/core/types';
import { BaseRoute } from 'src/core/utils';
import { HelloRoutes } from './constants';
import { HelloController } from './controllers';
import {
  SayHelloRequestQuery,
  SayHelloResponse,
  SqyHelloDescription,
  SqyHelloSummary,
} from './dto';

export default class HelloRoute extends BaseRoute {
  private readonly TAG = 'hello';

  constructor(private readonly helloController: HelloController) {
    super();
  }

  registerRoutes(webServer: WebServer) {
    webServer.get(
      HelloRoutes.HELLO,
      {
        schema: {
          querystring: SayHelloRequestQuery,
          response: SayHelloResponse,
          summary: SqyHelloSummary,
          description: SqyHelloDescription,
          tags: [this.TAG],
        },
      },
      this.helloController.sayHello,
    );
  }
}
