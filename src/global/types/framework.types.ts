import { AwilixContainer } from 'awilix';
import fastify from 'fastify';

export type AppContainer = AwilixContainer;
export type WebServer = ReturnType<typeof fastify>;
