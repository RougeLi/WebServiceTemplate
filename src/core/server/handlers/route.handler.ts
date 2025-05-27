import { AppContainer, ClassType, IRoute, WebServer } from 'src/core/types';
import { isRouteClass, UNMARKED_ACCESS } from 'src/core/utils';
import { getAccessLevel } from 'src/core/utils/base.route';

/**
 * ROUTE_TOKENS is a Set that stores the tokens for all registered routes.
 * These tokens represent route classes that implement the IRoute interface and
 * are to be registered with the Fastify web server. Each token corresponds to a
 * class that contains route definitions.
 * Using a Set ensures that duplicate tokens are automatically handled.
 */
const ROUTE_TOKENS: Set<string> = new Set();

export function clearRouteTokens(): void {
  ROUTE_TOKENS.clear();
}

export function getRouteTokens(): string[] {
  return Array.from(ROUTE_TOKENS);
}

/**
 * Adds a route token to the ROUTE_TOKENS set.
 * @param token {string} - The token representing the route.
 */
function addRouteToken(token: string) {
  ROUTE_TOKENS.add(token);
}

/**
 * Registers a route token if the provided class type implements the IRoute interface.
 * This function checks if the class is a route (i.e., it implements IRoute) and, if so,
 * adds its token to the ROUTE_TOKENS set.
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
 * Registers all routes stored in the ROUTE_TOKENS set with the Fastify web server.
 * For each route token, the corresponding route class is resolved from the DI container.
 * Once resolved, the route's `registerRoutes` method is called to define its HTTP routes
 * on the provided Fastify server instance.
 *
 * @param container {AppContainer} - The DI container used to resolve the route dependencies.
 * @param webServer {WebServer} - The Fastify server instance where the routes will be registered.
 * @param routeAccessTags {string[]} - Optional array of access tags to control route registration.
 */
export function registerRoutes(
  container: AppContainer,
  webServer: WebServer,
  routeAccessTags: string[] = [],
): void {
  if (ROUTE_TOKENS.size === 0) {
    console.warn(
      'Warning: No routes have been registered. The API will have no endpoints.',
    );
    return;
  }

  // Convert the provided access tags array into a Set for a quick lookup.
  const allowedTags = new Set(routeAccessTags);
  // If no access tags are provided, allow all routes to be registered.
  const allowAll = allowedTags.size === 0;

  for (const token of ROUTE_TOKENS) {
    const route = container.resolve<IRoute>(token);
    const className = route.constructor.name;
    const level = getAccessLevel(route.constructor);
    const shouldRegister = shouldRegisterRoute(level, allowedTags, allowAll);

    if (!shouldRegister) {
      console.log(`▸ Skip [${level}] ${className}`);
    } else {
      if (!allowAll) {
        console.log(`▸ Register [${level}] ${className}`);
      }
      route.registerRoutes(webServer);
    }
  }

  if (allowAll) {
    console.log(`▸ Registered all eligible routes in default mode`);
  }
}

/**
 * Determines whether a route should be registered based on its access level,
 * the set of allowed access tags, and whether all routes are allowed.
 *
 * @param level - The access level of the route.
 * @param allowedTags - The set of allowed access tags.
 * @param allowAll - A flag indicating whether all routes are allowed.
 * @returns A boolean indicating whether the route should be registered.
 */
function shouldRegisterRoute(
  level: string,
  allowedTags: Set<string>,
  allowAll: boolean,
): boolean {
  return allowAll || (level !== UNMARKED_ACCESS && allowedTags.has(level));
}
