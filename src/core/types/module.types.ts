import { DependencyResolver } from './di.types';

/**
 * InjectionToken defines the token used to register a dependency.
 * It is typically a string that identifies the service in the DI container.
 */
type InjectionToken = string;

/**
 * DependencyRegistration defines a tuple that associates an InjectionToken
 * with a DependencyResolver.
 * This tuple is used to register a service in the DI container.
 */
export type DependencyRegistration = [InjectionToken, DependencyResolver];

/**
 * DependencyRegistrations defines an array of DependencyRegistration tuples.
 * It is used to represent multiple dependency registrations for a module.
 */
export type DependencyRegistrations = DependencyRegistration[];

/**
 * The IModule interface defines the contract for modules that register dependencies.
 * A module must implement the getRegisterDependencies method to provide its dependencies.
 */
export interface IModule {
  /**
   * The getRegisterDependencies method is responsible for returning the dependencies
   * defined within the module that need to be registered into the DI container.
   * @returns {DependencyRegistrations} - An array containing the dependency registration information for the module.
   */
  getRegisterDependencies: () => DependencyRegistrations;
}
