import { InjectionResolverMode } from 'src/core/constants';
import { registerRouteToken } from 'src/core/server';
import { ClassType, DependencyRegistrations, IModule } from 'src/core/types';
import { makeDependencyRegistration } from './di-registration-factory';

type DependencyRegistrationItem = readonly [
  injectionToken: string,
  classType: ClassType,
  injectionMode?: InjectionResolverMode,
];

type DependencyRegistrationPair = readonly [
  injectionToken: string,
  classType: ClassType,
];

/**
 * BaseModule is an abstract class that implements the IModule interface.
 *
 * It provides a base structure for registering dependencies and routes within modules.
 * It also offers helper methods for different dependency injection scopes:
 * Singleton, Scoped, and Transient.
 */
export default abstract class BaseModule implements IModule {
  readonly dependencyRegistrations: DependencyRegistrations = [];

  getRegisterDependencies(): DependencyRegistrations {
    this.registerDependencies();
    return this.dependencyRegistrations;
  }

  abstract registerDependencies(): void;

  registerDependency(
    injectionToken: string,
    classType: ClassType,
    injectionMode: InjectionResolverMode = InjectionResolverMode.SINGLETON,
  ): this {
    registerRouteToken(injectionToken, classType);

    this.dependencyRegistrations.push(
      makeDependencyRegistration(injectionToken, classType, injectionMode),
    );

    return this;
  }

  registerDependenciesByItems(
    items: readonly DependencyRegistrationItem[],
  ): this {
    for (const [injectionToken, classType, injectionMode] of items) {
      this.registerDependency(injectionToken, classType, injectionMode);
    }

    return this;
  }

  registerSingleton(injectionToken: string, classType: ClassType): this {
    return this.registerDependency(
      injectionToken,
      classType,
      InjectionResolverMode.SINGLETON,
    );
  }

  registerScoped(injectionToken: string, classType: ClassType): this {
    return this.registerDependency(
      injectionToken,
      classType,
      InjectionResolverMode.SCOPED,
    );
  }

  registerTransient(injectionToken: string, classType: ClassType): this {
    return this.registerDependency(
      injectionToken,
      classType,
      InjectionResolverMode.TRANSIENT,
    );
  }

  registerSingletons(items: readonly DependencyRegistrationPair[]): this {
    for (const [injectionToken, classType] of items) {
      this.registerSingleton(injectionToken, classType);
    }

    return this;
  }

  registerScopes(items: readonly DependencyRegistrationPair[]): this {
    for (const [injectionToken, classType] of items) {
      this.registerScoped(injectionToken, classType);
    }

    return this;
  }

  registerTransients(items: readonly DependencyRegistrationPair[]): this {
    for (const [injectionToken, classType] of items) {
      this.registerTransient(injectionToken, classType);
    }

    return this;
  }
}
