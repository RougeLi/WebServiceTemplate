import { InjectionResolverMode } from 'src/core/constants';
import { registerRouteToken } from 'src/core/server';
import {
  ClassType,
  DependencyRegistration,
  DependencyRegistrations,
  IModule,
} from 'src/core/types';
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
  private readonly dependencyRegistrations: DependencyRegistration[] = [];

  /**
   * Rebuilds declarations from empty state and returns a readonly snapshot.
   * Collection state is discarded even if registration throws; the original
   * error propagates and a later call can retry the complete declaration.
   */
  getRegisterDependencies(): DependencyRegistrations {
    this.dependencyRegistrations.length = 0;
    try {
      this.registerDependencies();
      return [...this.dependencyRegistrations];
    } finally {
      this.dependencyRegistrations.length = 0;
    }
  }

  /**
   * Declares this module's dependencies deterministically on every collection.
   * Place registration helper calls here so they are replayed during rebuilds.
   */
  abstract registerDependencies(): void;

  /**
   * Registers one dependency and its route token when the class is a route.
   * The resolver defaults to singleton when `injectionMode` is omitted.
   */
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

  /**
   * Registers dependency tuples in input order, defaulting omitted modes to
   * singleton.
   */
  registerDependenciesByItems(
    items: readonly DependencyRegistrationItem[],
  ): this {
    for (const [injectionToken, classType, injectionMode] of items) {
      this.registerDependency(injectionToken, classType, injectionMode);
    }

    return this;
  }

  /**
   * Registers one singleton dependency.
   */
  registerSingleton(injectionToken: string, classType: ClassType): this {
    return this.registerDependency(
      injectionToken,
      classType,
      InjectionResolverMode.SINGLETON,
    );
  }

  /**
   * Registers one scoped dependency.
   */
  registerScoped(injectionToken: string, classType: ClassType): this {
    return this.registerDependency(
      injectionToken,
      classType,
      InjectionResolverMode.SCOPED,
    );
  }

  /**
   * Registers one transient dependency.
   */
  registerTransient(injectionToken: string, classType: ClassType): this {
    return this.registerDependency(
      injectionToken,
      classType,
      InjectionResolverMode.TRANSIENT,
    );
  }

  /**
   * Registers dependency tuples as singletons in input order.
   */
  registerSingletons(items: readonly DependencyRegistrationPair[]): this {
    for (const [injectionToken, classType] of items) {
      this.registerSingleton(injectionToken, classType);
    }

    return this;
  }

  /**
   * Registers dependency tuples with scoped lifetimes in input order.
   */
  registerScopedDependencies(
    items: readonly DependencyRegistrationPair[],
  ): this {
    for (const [injectionToken, classType] of items) {
      this.registerScoped(injectionToken, classType);
    }

    return this;
  }

  /**
   * Registers dependency tuples as transients in input order.
   */
  registerTransients(items: readonly DependencyRegistrationPair[]): this {
    for (const [injectionToken, classType] of items) {
      this.registerTransient(injectionToken, classType);
    }

    return this;
  }
}
