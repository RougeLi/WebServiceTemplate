import { asClass, BuildResolver, DisposableResolver, Disposer } from 'awilix';
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
 * the ContainerRegistration tuple format. An optional disposer is attached with Awilix's
 * `.disposer()`, so `container.dispose()` releases resolved singleton/scoped instances.
 */
export function makeContainerRegistration(
  token: ContainerTokens,
  classType: ClassType,
  injectionMode: InjectionResolverMode,
  disposer?: Disposer<object>,
): ContainerRegistration {
  const registration = makeDependencyRegistration(
    token,
    classType,
    injectionMode,
  ) as ContainerRegistration;

  if (!disposer) {
    return registration;
  }

  const [registrationToken, resolver] = registration;
  return [
    registrationToken,
    (resolver as BuildResolver<object> & DisposableResolver<object>).disposer(
      disposer,
    ),
  ];
}
