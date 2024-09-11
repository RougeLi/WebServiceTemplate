import { Static } from '@sinclair/typebox';
import { FastifyRequest } from 'fastify';
import { SayHelloQuery } from 'src/hello/dto/hello.dto';

export enum Routes {
  HELLO = '/hello',
}

export enum InjectionTokens {
  HELLO_ROUTE = 'helloRoute',
  HELLO_CONTROLLER = 'helloController',
  HELLO_SERVICE = 'helloService',
}

export type SayHelloQueryType = Static<typeof SayHelloQuery>;

export type SayHelloRequestType = FastifyRequest<{
  Querystring: SayHelloQueryType;
}>;
