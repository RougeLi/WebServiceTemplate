import { StatusCodes } from 'http-status-codes';
import { CommonSchema } from 'src/core/server';
import { WebServer } from 'src/core/types';
import { BaseRoute } from 'src/core/utils';
import { HelloRoutes } from './constants';
import { HelloController } from './controllers';
import { SayHelloQuery, SayHelloResponse } from './dto';

export default class HelloRoute extends BaseRoute {
  constructor(private readonly helloController: HelloController) {
    super();
  }

  registerRoutes(webServer: WebServer) {
    webServer.get(
      HelloRoutes.HELLO,
      {
        schema: {
          querystring: SayHelloQuery,
          response: {
            ...CommonSchema,
            [StatusCodes.OK]: SayHelloResponse,
          },
          description:
            '該端點根據提供的姓名和年齡生成問候消息。如果未提供姓名，將返回默認消息。',
          summary: '生成個性化的問候消息。',
          tags: ['hello'],
        },
      },
      this.helloController.sayHello,
    );
  }
}
