import { asClass } from 'awilix';
import {
  ClassType,
  InjectionResolverMode,
} from 'src/global/types/framework.types';
import {
  DependencyRegistrations,
  IModule,
} from 'src/global/types/module.types';
import { registerRouteToken } from 'src/server/handlers/route.handler';

/**
 * BaseModule is an abstract class that implements the IModule interface.
 * It provides a base structure for registering dependencies and routes within modules.
 * It also offers helper methods for different dependency injection scopes: Singleton, Scoped, and Transient.
 */
export abstract class BaseModule implements IModule {
  readonly dependencyRegistrations: DependencyRegistrations = [];

  /**
   * Retrieves the dependencies that have been registered for this module.
   * This method first calls the abstract `registerDependencies` method to allow
   * the module to define its dependencies, then returns the list of registered dependencies.
   * @returns {DependencyRegistrations} - An array containing the dependency registration information for the module.
   */
  getRegisterDependencies(): DependencyRegistrations {
    this.registerDependencies();
    return this.dependencyRegistrations;
  }

  /**
   * Abstract method to register module dependencies.
   * Any class extending BaseModule must implement this method to define which dependencies
   * will be injected into the DI container.
   * @returns {DependencyRegistrations} - An array of DependencyRegistrations representing
   * the token-resolver pairs to be registered in the DI container.
   */
  abstract registerDependencies(): void;

  /**
   * Registers a dependency for the module with a specific injection mode.
   * This method registers the dependency under the specified InjectionToken and configures
   * the injection mode (such as singleton, scoped, transient). It also registers the route token
   * in the routing system using `registerRouteToken`.
   *
   * After registering the dependency, it adds the token and resolver to the `dependencyRegistrations` array.
   *
   * @param InjectionToken {string} - The token used to identify the dependency in the DI container.
   * @param classType {ClassType} - The class constructor for the dependency to be registered.
   * @param injectionMode {InjectionResolverMode} - The mode to use for injecting the dependency (singleton, scoped, etc.).
   * @returns {this} - The module instance, allowing for method chaining.
   */
  registerDependency(
    InjectionToken: string,
    classType: ClassType,
    injectionMode: InjectionResolverMode,
  ): this {
    registerRouteToken(InjectionToken, classType);

    switch (injectionMode) {
      case InjectionResolverMode.SINGLETON:
        this.dependencyRegistrations.push([
          InjectionToken,
          asClass(classType).singleton(),
        ]);
        break;
      case InjectionResolverMode.SCOPED:
        this.dependencyRegistrations.push([
          InjectionToken,
          asClass(classType).scoped(),
        ]);
        break;
      case InjectionResolverMode.TRANSIENT:
        this.dependencyRegistrations.push([
          InjectionToken,
          asClass(classType).transient(),
        ]);
        break;
      case InjectionResolverMode.PROXY:
        this.dependencyRegistrations.push([
          InjectionToken,
          asClass(classType).proxy(),
        ]);
        break;
      case InjectionResolverMode.CLASSIC:
        this.dependencyRegistrations.push([
          InjectionToken,
          asClass(classType).classic(),
        ]);
        break;
      default:
        this.dependencyRegistrations.push([InjectionToken, asClass(classType)]);
        break;
    }

    return this;
  }
}