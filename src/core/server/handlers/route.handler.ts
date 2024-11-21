import { AppContainer, ClassType, IRoute, WebServer } from 'src/core/types';
import { isRouteClass } from 'src/core/utils';

/**
 * ROUTE_TOKENS is an array that stores the tokens for all registered routes.
 * These tokens represent route classes that implement the IRoute interface and
 * are to be registered with the Fastify web server. Each token corresponds to a
 * class that contains route definitions.
 */
export const ROUTE_TOKENS: string[] = [];

/**
 * Adds a route token to the ROUTE_TOKENS array.
 * @param token {string} - The token representing the route.
 */
function addRouteToken(token: string) {
  ROUTE_TOKENS.push(token);
}

/**
 * Registers a route token if the provided class type implements the IRoute interface.
 * This function checks if the class is a route (i.e., it implements IRoute) and, if so,
 * adds its token to the ROUTE_TOKENS array.
 *
 * @param injectionToken {string} - The token representing the route in the DI container.
 * @param classType {ClassType} - The class constructor to check and potentially register as a route.
 */
export function registerRouteToken(
  injectionToken: string,
  classType: ClassType,
) {
  if (isRouteClass(classType)) {
    addRouteToken(injectionToken);
  }
}

/**
 * Registers all routes stored in the ROUTE_TOKENS array with the Fastify web server.
 * For each route token, the corresponding route class is resolved from the DI container.
 * Once resolved, the route's `registerRoutes` method is called to define its HTTP routes
 * on the provided Fastify server instance.
 *
 * @param container {AppContainer} - The DI container used to resolve the route dependencies.
 * @param webServer {WebServer} - The Fastify server instance where the routes will be registered.
 */
export function registerRoutes(
  container: AppContainer,
  webServer: WebServer,
): void {
  ROUTE_TOKENS.forEach((token: string) => {
    const route = container.resolve<IRoute>(token);
    route.registerRoutes(webServer);
  });
}
