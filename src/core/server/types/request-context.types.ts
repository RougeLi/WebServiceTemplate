// noinspection JSUnusedGlobalSymbols

import { Static, TSchema } from '@sinclair/typebox';
import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { FastifyBaseLogger } from 'fastify/types/logger';

/** Extend @fastify/request-context module to include logger in request context */
declare module '@fastify/request-context' {
  interface RequestContextData {
    logger: FastifyBaseLogger;
  }
}

/** Get a static type from TypeBox schema type */
export type TypeBoxStatic<T> = T extends TSchema ? Static<T> : unknown;

/** Route type definition for Fastify routes with TypeBox schema validation */
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

/** Quick extraction helpers for specific parts, with a semantic name */
export type RouteQuery<T extends TSchema | undefined> =
  RouteType<T>['Querystring'];
export type RouteBody<T extends TSchema | undefined> = RouteType<
  undefined,
  T
>['Body'];
export type RouteParams<T extends TSchema | undefined> = RouteType<
  undefined,
  undefined,
  T
>['Params'];
export type RouteHeaders<T extends TSchema | undefined> = RouteType<
  undefined,
  undefined,
  undefined,
  T
>['Headers'];

export { FastifyRequest, FastifyReply };
