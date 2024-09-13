import { AwilixContainer, Constructor, Resolver } from 'awilix';
import { FastifyInstance } from 'fastify';

/**
 * AppContainer is a type alias for the AwilixContainer, which serves as a dependency injection container.
 * It is responsible for resolving and managing dependencies throughout the application,
 * allowing classes, services, and other dependencies to be injected where needed.
 */
export type AppContainer = AwilixContainer;

/**
 * WebServer is a type alias for FastifyInstance.
 * It represents the Fastify web server instance, which is responsible for handling HTTP requests,
 * defining routes, managing middleware, and responding to client requests.
 */
export type WebServer = FastifyInstance;

/**
 * DependencyResolver defines a type for the resolver object provided by the Awilix DI container.
 * This resolver is responsible for instantiating or resolving dependencies based on their registered tokens.
 * The type `unknown` is used to indicate that the resolved dependency can be of any type.
 */
export type DependencyResolver = Resolver<unknown>;

/**
 * ClassType represents a constructor function for a class that can be instantiated.
 * It is used in the DI container to register class-based dependencies.
 */
export type ClassType = Constructor<object>;

/**
 * InjectionResolverMode specifies various modes for resolving dependencies in the DI container.
 * - SINGLETON: Shares the same instance across the entire application lifecycle.
 * - SCOPED: Creates a new instance for each request or scope, commonly used in web requests.
 * - TRANSIENT: Instantiates a new instance every time the dependency is requested.
 * - PROXY: Lazily creates instances when accessed, useful for testing or delayed instantiation.
 * - CLASSIC: Provides a flexible instantiation method, allowing for traditional object creation patterns.
 */
export enum InjectionResolverMode {
  SINGLETON = 'singleton',
  SCOPED = 'scoped',
  TRANSIENT = 'transient',
  PROXY = 'proxy',
  CLASSIC = 'classic',
}

/**
 * IRoute interface defines the contract for registering routes in a module.
 * Any class that implements this interface must provide a method to register routes
 * into a Fastify web server instance.
 */
export interface IRoute {
  /**
   * registerRoutes is a method used to define and register HTTP routes
   * on the provided Fastify web server instance. The routes handle specific
   * HTTP methods and paths, and are responsible for processing incoming requests.
   * @param webServer {WebServer} - The Fastify web server instance where routes are registered.
   */
  registerRoutes: (webServer: WebServer) => void;
}
