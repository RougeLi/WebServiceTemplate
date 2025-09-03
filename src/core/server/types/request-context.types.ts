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

/** Route request type definition with query parameters and optional parameters/headers */
export type RouteQueryRequest<
  Q extends TSchema | undefined = undefined,
  P extends TSchema | undefined = undefined,
  H extends TSchema | undefined = undefined,
> = FastifyRequest<RouteType<Q, undefined, P, H>>;

/** Route request type definition with body payload and optional parameters/headers */
export type RouteBodyRequest<
  B extends TSchema | undefined = undefined,
  P extends TSchema | undefined = undefined,
  H extends TSchema | undefined = undefined,
> = FastifyRequest<RouteType<undefined, B, P, H>>;

/** Route request type definition with URL parameters and optional headers */
export type RouteParamsRequest<
  P extends TSchema | undefined = undefined,
  H extends TSchema | undefined = undefined,
> = FastifyRequest<RouteType<undefined, undefined, P, H>>;

/** Route request type definition with headers only */
export type RouteHeadersRequest<H extends TSchema | undefined = undefined> =
  FastifyRequest<RouteHeaders<H>>;

/** Generic route request type definition with optional query/body/params/headers */
export type RouteRequest<
  Q extends TSchema | undefined = undefined,
  B extends TSchema | undefined = undefined,
  P extends TSchema | undefined = undefined,
  H extends TSchema | undefined = undefined,
> = FastifyRequest<RouteType<Q, B, P, H>>;

/** Type for typed response data */
export type TypedResponse<T extends TSchema | undefined = undefined> =
  TypeBoxStatic<T>;

/** Type for typed response data wrapped in a Promise */
export type TypedResponsePromise<T extends TSchema | undefined = undefined> =
  Promise<TypeBoxStatic<T>>;

export { FastifyRequest, FastifyReply };
