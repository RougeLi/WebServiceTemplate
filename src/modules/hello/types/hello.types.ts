import { Static } from '@sinclair/typebox';
import { FastifyRequest } from 'fastify';
import { SayHelloQuery } from 'src/modules/hello/dto/hello.dto';

export type SayHelloQueryType = Static<typeof SayHelloQuery>;

export type SayHelloRequestType = FastifyRequest<{
  Querystring: SayHelloQueryType;
}>;
