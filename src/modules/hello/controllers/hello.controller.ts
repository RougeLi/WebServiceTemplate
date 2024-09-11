import { Static } from '@sinclair/typebox';
import { FastifyRequest } from 'fastify';
import { SayHelloRequestQuery } from '../dto';
import { HelloService } from '../services';

export default class HelloController {
  constructor(private readonly helloService: HelloService) {}

  sayHello = (
    request: FastifyRequest<{
      Querystring: Static<typeof SayHelloRequestQuery>;
    }>,
  ) => {
    const { query } = request;
    return this.helloService.sayHello(query);
  };
}
