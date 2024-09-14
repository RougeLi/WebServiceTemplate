import { asClass } from 'awilix';
import ContainerTokens from 'src/global/container-tokens';
import { ContainerRegistration } from 'src/global/types/container-registrations.types';
import {
  ClassType,
  InjectionResolverMode,
} from 'src/global/types/framework.types';
import { DependencyRegistration } from 'src/global/types/module.types';

/**
 * Creates a DependencyRegistration tuple based on the provided injection mode.
 * This function can be used to register a service into the DI container with a specific
 * injection mode (singleton, scoped, transient, etc.).
 *
 * @param token {string} - The token used to register the dependency in the DI container.
 * @param classType {ClassType} - The class constructor for the dependency to be registered.
 * @param injectionMode {InjectionResolverMode} - The mode for injecting the dependency (singleton, scoped, etc.).
 * @returns {DependencyRegistration} - A tuple containing the token and its corresponding resolver.
 */
export function makeDependencyRegistration(
  token: string,
  classType: ClassType,
  injectionMode: InjectionResolverMode,
): DependencyRegistration {
  switch (injectionMode) {
    case InjectionResolverMode.SINGLETON:
      return [token, asClass(classType).singleton()];
    case InjectionResolverMode.SCOPED:
      return [token, asClass(classType).scoped()];
    case InjectionResolverMode.TRANSIENT:
      return [token, asClass(classType).transient()];
    case InjectionResolverMode.PROXY:
      return [token, asClass(classType).proxy()];
    case InjectionResolverMode.CLASSIC:
      return [token, asClass(classType).classic()];
    default:
      return [token, asClass(classType)];
  }
}

/**
 * Creates a ContainerRegistration tuple specifically for registering a container's services
 * in the DI container based on the provided injection mode.
 * This function reuses makeDependencyRegistration and ensures the return type aligns with
 * the ContainerRegistration tuple format.
 *
 * @param token {ContainerTokens} - The token used to register the container service in the DI container.
 * @param classType {ClassType} - The class constructor for the service to be registered.
 * @param injectionMode {InjectionResolverMode} - The mode for injecting the service (singleton, scoped, etc.).
 * @returns {ContainerRegistration} - A tuple containing the token and its corresponding resolver for the container.
 */
export function makeContainerRegistration(
  token: ContainerTokens,
  classType: ClassType,
  injectionMode: InjectionResolverMode,
): ContainerRegistration {
  return makeDependencyRegistration(
    token,
    classType,
    injectionMode,
  ) as ContainerRegistration;
}
