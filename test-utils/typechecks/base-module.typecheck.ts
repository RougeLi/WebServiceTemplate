import { InjectionResolverMode } from 'src/core/constants';
import {
  DependencyRegistration,
  DependencyRegistrations,
  IModule,
} from 'src/core/types';
import BaseModule from 'src/core/utils/base.module';

class TestService {}

class TypedModule extends BaseModule {
  registerDependencies(): void {}

  customMethod(): void {}
}

// Compile-time fixtures only; checked by pnpm run type:check:spec.
export function checkRegistrationHelpers(module: TypedModule): void {
  const mixedItems = [
    ['default', TestService],
    ['undefined', TestService, undefined],
    ['scoped', TestService, InjectionResolverMode.SCOPED],
  ] as const;
  const pairs = [['service', TestService]] as const;
  const empty = [] as const;

  module
    .registerDependency('default', TestService)
    .registerDependency('undefined', TestService, undefined)
    .registerDependenciesByItems(mixedItems)
    .registerSingleton('singleton', TestService)
    .registerScoped('scoped', TestService)
    .registerTransient('transient', TestService)
    .registerSingletons(pairs)
    .registerScopedDependencies(pairs)
    .registerTransients(pairs)
    .registerDependenciesByItems(empty)
    .registerSingletons(empty)
    .registerScopedDependencies(empty)
    .registerTransients(empty)
    .customMethod();

  // @ts-expect-error Collection storage is owned by BaseModule.
  module.dependencyRegistrations;
  // @ts-expect-error BaseModule itself also exposes a readonly snapshot.
  module.getRegisterDependencies().pop();
}

export function checkReadonlyRegistrations(module: IModule): void {
  const registration: DependencyRegistration = [
    'service',
    { resolve: () => new TestService() },
  ] as const;
  const declarations: DependencyRegistrations = [registration] as const;
  const readonlyModule: IModule = {
    getRegisterDependencies: () => declarations,
  };
  readonlyModule.getRegisterDependencies();

  const registrations = module.getRegisterDependencies();
  // @ts-expect-error Callers cannot append to a readonly collection.
  registrations.push(registration);
  // @ts-expect-error Callers cannot reorder a readonly collection.
  registrations.reverse();
  // @ts-expect-error Callers cannot replace a registration.
  registrations[0] = registration;
  // @ts-expect-error Registration tokens are readonly tuple elements.
  registrations[0][0] = 'replacement';
  // @ts-expect-error Registration resolvers are readonly tuple elements.
  registrations[0][1] = { resolve: () => undefined };
}
