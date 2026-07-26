import { InjectionResolverMode } from 'src/core/constants';
import {
  clearRouteTokens,
  getRouteTokens,
} from 'src/core/server/handlers/route.handler';
import { WebServer } from 'src/core/types';
import BaseModule from '../base.module';
import { BaseRoute } from '../base.route';
import { makeDependencyRegistration } from '../di-registration-factory';

jest.mock('../di-registration-factory', () => ({
  makeDependencyRegistration: jest.fn((token: string) => [
    token,
    { resolve: jest.fn() },
  ]),
}));

class TestModule extends BaseModule {
  registerDependencies(): void {}
}

class TestService {}

class AnotherService {}

class TestRoute extends BaseRoute {
  registerRoutes(_webServer: WebServer): void {}
}

const makeDependencyRegistrationMock =
  makeDependencyRegistration as jest.MockedFunction<
    typeof makeDependencyRegistration
  >;

describe('BaseModule', () => {
  let module: TestModule;

  beforeEach(() => {
    module = new TestModule();
    clearRouteTokens();
  });

  afterAll(() => {
    clearRouteTokens();
  });

  describe('generic registration helpers', () => {
    it('defaults omitted and undefined modes to singleton', () => {
      module
        .registerDependency('omitted', TestService)
        .registerDependency('undefined', AnotherService, undefined);

      expect(makeDependencyRegistrationMock.mock.calls).toEqual([
        ['omitted', TestService, InjectionResolverMode.SINGLETON],
        ['undefined', AnotherService, InjectionResolverMode.SINGLETON],
      ]);
    });

    it.each(Object.values(InjectionResolverMode))(
      'forwards the explicit %s mode',
      (injectionMode) => {
        module.registerDependency('service', TestService, injectionMode);

        expect(makeDependencyRegistrationMock).toHaveBeenCalledWith(
          'service',
          TestService,
          injectionMode,
        );
      },
    );

    it('registers readonly mixed-mode items in input order', () => {
      const items = [
        ['default', TestService],
        ['scoped', AnotherService, InjectionResolverMode.SCOPED],
        ['transient', TestService, InjectionResolverMode.TRANSIENT],
        ['proxy', AnotherService, InjectionResolverMode.PROXY],
        ['classic', TestService, InjectionResolverMode.CLASSIC],
      ] as const;

      const result = module.registerDependenciesByItems(items);

      expect(result).toBe(module);
      expect(makeDependencyRegistrationMock.mock.calls).toEqual([
        ['default', TestService, InjectionResolverMode.SINGLETON],
        ['scoped', AnotherService, InjectionResolverMode.SCOPED],
        ['transient', TestService, InjectionResolverMode.TRANSIENT],
        ['proxy', AnotherService, InjectionResolverMode.PROXY],
        ['classic', TestService, InjectionResolverMode.CLASSIC],
      ]);
      expect(
        module.dependencyRegistrations.map(
          ([injectionToken]) => injectionToken,
        ),
      ).toEqual(['default', 'scoped', 'transient', 'proxy', 'classic']);
    });
  });

  describe('lifetime-specific helpers', () => {
    it('registers and chains singleton, scoped, and transient dependencies', () => {
      const result = module
        .registerSingleton('singleton', TestService)
        .registerScoped('scoped', AnotherService)
        .registerTransient('transient', TestService);

      expect(result).toBe(module);
      expect(makeDependencyRegistrationMock.mock.calls).toEqual([
        ['singleton', TestService, InjectionResolverMode.SINGLETON],
        ['scoped', AnotherService, InjectionResolverMode.SCOPED],
        ['transient', TestService, InjectionResolverMode.TRANSIENT],
      ]);
    });

    it('registers readonly lifetime batches in input order', () => {
      const singletonItems = [
        ['singleton:first', TestService],
        ['singleton:second', AnotherService],
      ] as const;
      const scopedItems = [
        ['scoped:first', AnotherService],
        ['scoped:second', TestService],
      ] as const;
      const transientItems = [
        ['transient:first', TestService],
        ['transient:second', AnotherService],
      ] as const;

      const result = module
        .registerSingletons(singletonItems)
        .registerScopedDependencies(scopedItems)
        .registerTransients(transientItems);

      expect(result).toBe(module);
      expect(makeDependencyRegistrationMock.mock.calls).toEqual([
        ['singleton:first', TestService, InjectionResolverMode.SINGLETON],
        ['singleton:second', AnotherService, InjectionResolverMode.SINGLETON],
        ['scoped:first', AnotherService, InjectionResolverMode.SCOPED],
        ['scoped:second', TestService, InjectionResolverMode.SCOPED],
        ['transient:first', TestService, InjectionResolverMode.TRANSIENT],
        ['transient:second', AnotherService, InjectionResolverMode.TRANSIENT],
      ]);
    });

    it('treats empty batches as chainable no-ops', () => {
      const emptyItems = [] as const;

      const result = module
        .registerDependenciesByItems(emptyItems)
        .registerSingletons(emptyItems)
        .registerScopedDependencies(emptyItems)
        .registerTransients(emptyItems);

      expect(result).toBe(module);
      expect(module.dependencyRegistrations).toEqual([]);
      expect(makeDependencyRegistrationMock).not.toHaveBeenCalled();
    });
  });

  it('preserves route-token side effects through every helper', () => {
    module
      .registerDependency('route:dependency', TestRoute)
      .registerDependenciesByItems([['route:items', TestRoute]] as const)
      .registerSingleton('route:singleton', TestRoute)
      .registerScoped('route:scoped', TestRoute)
      .registerTransient('route:transient', TestRoute)
      .registerSingletons([['route:singletons', TestRoute]] as const)
      .registerScopedDependencies([['route:scoped-items', TestRoute]] as const)
      .registerTransients([['route:transients', TestRoute]] as const)
      .registerSingleton('service', TestService);

    expect(getRouteTokens()).toEqual([
      'route:dependency',
      'route:items',
      'route:singleton',
      'route:scoped',
      'route:transient',
      'route:singletons',
      'route:scoped-items',
      'route:transients',
    ]);
  });
});
