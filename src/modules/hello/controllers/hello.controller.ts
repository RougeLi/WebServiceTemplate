import { Static } from '@sinclair/typebox';
import { FastifyRequest } from 'fastify';
import { SayHelloQuery } from 'src/modules/hello/dto';
import { HelloService } from '../services';

export default class HelloController {
  constructor(private readonly helloService: HelloService) {}

  sayHello = (
    request: FastifyRequest<{
      Querystring: Static<typeof SayHelloQuery>;
    }>,
  ) => {
    const { query } = request;
    return this.helloService.sayHello(query);
  };
}
