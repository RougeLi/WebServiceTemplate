// noinspection JSUnusedGlobalSymbols

import { Static, TSchema } from '@sinclair/typebox';
import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { FastifyBaseLogger } from 'fastify/types/logger';

/** Extend @fastify/request-context module to add logger to request context */
declare module '@fastify/request-context' {
  interface RequestContextData {
    logger: FastifyBaseLogger;
  }
}

/** Get a static type from TypeBox schema type */
export type TypeBoxStatic<T> = T extends TSchema ? Static<T> : unknown;

/** Type definition for Fastify route with TypeBox schema validation support */
export type RouteType<
  Q extends TSchema | undefined = undefined,
  B extends TSchema | undefined = undefined,
  P extends TSchema | undefined = undefined,
  H extends TSchema | undefined = undefined,
> = Omit<
  RouteGenericInterface,
  'Querystring' | 'Body' | 'Params' | 'Headers'
> & {
  Querystring: TypeBoxStatic<Q>;
  Body: TypeBoxStatic<B>;
  Params: TypeBoxStatic<P>;
  Headers: TypeBoxStatic<H>;
};

/** Helper type for query parameters */
export type RouteQuery<T extends TSchema | undefined> = RouteType<T>;

/** Helper type for request body */
export type RouteBody<T extends TSchema | undefined> = RouteType<undefined, T>;

/** Helper type for URL parameters */
export type RouteParams<T extends TSchema | undefined> = RouteType<
  undefined,
  undefined,
  T
>;

/** Helper type for request headers */
export type RouteHeaders<T extends TSchema | undefined> = RouteType<
  undefined,
  undefined,
  undefined,
  T
>;

export { FastifyRequest, FastifyReply };
