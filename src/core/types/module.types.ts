import { DependencyResolver } from './di.types';

/**
 * InjectionToken defines the token used to register a dependency.
 * It is typically a string that identifies the service in the DI container.
 */
type InjectionToken = string;

/**
 * DependencyRegistration defines a readonly tuple that associates an InjectionToken
 * with a DependencyResolver.
 * This tuple is used to register a service in the DI container.
 */
export type DependencyRegistration = readonly [
  InjectionToken,
  DependencyResolver,
];

/**
 * DependencyRegistrations is a readonly collection of registration tuples.
 * Callers can iterate over declarations without owning module collection state.
 */
export type DependencyRegistrations = readonly DependencyRegistration[];

/**
 * The IModule interface defines the contract for modules that register dependencies.
 * A module must implement the getRegisterDependencies method to provide its dependencies.
 */
export interface IModule {
  /**
   * Returns a readonly snapshot of the module's complete declarations.
   * Repeated calls must preserve token, resolver mode, and declaration order
   * without accumulation. Resolver reference identity need not be preserved.
   * A failed collection propagates its original error without retaining partial
   * registrations for the next call.
   */
  getRegisterDependencies: () => DependencyRegistrations;
}
