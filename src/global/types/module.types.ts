import { Resolver } from 'awilix';
import { AppContainer, WebServer } from 'src/global/types/framework.types';

/**
 * DependencyRegistration type defines the structure for registering a dependency,
 * including the dependency's name and its corresponding Resolver.
 */
type DependencyRegistration = {
  name: string;
  registration: Resolver<unknown>;
};

/**
 * The IModule interface defines the structure that a module should follow,
 */
export default interface IModule {
  /**
   * The registerDependencies method is used to register the module's dependencies
   * into the DI container.
   * @returns DependencyRegistration[] - An array containing the registration information for all dependencies.
   */
  registerDependencies: () => DependencyRegistration[];

  /**
   * The registerRoutes method is used to register the routes associated with the module.
   * @param container AppContainer - The DI container.
   * @param webServer WebServer - The web server used to register the routes.
   */
  registerRoutes: (container: AppContainer, webServer: WebServer) => void;
}
