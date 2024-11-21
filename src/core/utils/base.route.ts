import 'reflect-metadata';
import { IRoute, WebServer } from 'src/core/types';

/**
 * IS_ROUTE is a metadata key used to mark a class as a route.
 * This is used with Reflect metadata to identify route classes.
 */
export const IS_ROUTE = 'isRoute';

/**
 * MarkAsRoute is a decorator function that marks a class as a route by adding metadata.
 * The Reflection metadata API is used to define a custom metadata key (IS_ROUTE) on the target class.
 * This allows route classes to be dynamically detected and registered.
 *
 * @returns {ClassDecorator} - A class decorator function that adds route metadata to the class.
 */
function MarkAsRoute(): ClassDecorator {
  return function (target: Function): void {
    Reflect.defineMetadata(IS_ROUTE, true, target);
  };
}

/**
 * Checks if a class is marked as a route by examining its metadata.
 * This function uses Reflect metadata to check if the class or any of its prototypes
 * have been marked with the IS_ROUTE metadata key.
 *
 * @param classType {any} - The class constructor to check.
 * @returns {boolean} - Returns true if the class is marked as a route, otherwise false.
 */
export function isRouteClass(classType: any): boolean {
  while (classType) {
    if (Reflect.getMetadata(IS_ROUTE, classType)) {
      return true;
    }
    classType = Object.getPrototypeOf(classType);
  }
  return false;
}

/**
 * BaseRoute is an abstract class that provides a foundation for all route classes.
 * Classes extending BaseRoute must implement the `registerRoutes` method to define
 * their specific HTTP routes in the Fastify web server.
 *
 * This class is marked as a route using the MarkAsRoute decorator, which adds metadata
 * indicating that it is a route class. This metadata can be used to dynamically detect
 * and register routes within the application.
 */
@MarkAsRoute()
export abstract class BaseRoute implements IRoute {
  /**
   * Abstract method that must be implemented by subclasses to register their routes
   * in the Fastify web server.
   *
   * @param webServer {WebServer} - The Fastify web server instance where routes are registered.
   */
  abstract registerRoutes(webServer: WebServer): void;
}
