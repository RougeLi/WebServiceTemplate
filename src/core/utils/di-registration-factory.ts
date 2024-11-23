import { asClass } from 'awilix';
import { ContainerTokens, InjectionResolverMode } from 'src/core/constants';
import {
  ClassType,
  ContainerRegistration,
  DependencyRegistration,
} from 'src/core/types';

/**
 * Creates a DependencyRegistration tuple based on the provided injection mode.
 * This function can be used to register a service into the DI container with a specific
 * injection mode (singleton, scoped, transient, etc.).
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
