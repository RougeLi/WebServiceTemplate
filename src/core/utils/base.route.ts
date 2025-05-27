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

// Define the default access level constant
export const UNMARKED_ACCESS: string = 'unmarked';

// Use Symbol to ensure a unique metadata key for route access
const ROUTE_ACCESS_KEY: symbol = Symbol('route:access');

/**
 * A decorator function that assigns an access level to a route class.
 * Internally, it attaches the specified level to the target class using Reflect.defineMetadata.
 *
 * @param level - The access level (e.g., 'admin', 'user').
 * @returns A class decorator function.
 */
export function AccessLevel(level: string): ClassDecorator {
  return (target: Function): void => {
    Reflect.defineMetadata(ROUTE_ACCESS_KEY, level, target);
  };
}

/**
 * Retrieves the access level of a class by traversing its prototype chain.
 * If no access level is found, it returns the default 'unmarked' level.
 *
 * @param target - The class constructor to inspect.
 * @returns The access level associated with the class.
 */
export function getAccessLevel(target: Function): string {
  let currentTarget = target;

  while (currentTarget && currentTarget !== Function.prototype) {
    const lvl: string | undefined = Reflect.getMetadata(
      ROUTE_ACCESS_KEY,
      currentTarget,
    );
    if (lvl) return lvl;
    currentTarget = Object.getPrototypeOf(currentTarget);
  }
  return UNMARKED_ACCESS;
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
