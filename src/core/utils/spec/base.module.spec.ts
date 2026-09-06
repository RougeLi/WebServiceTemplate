import { InjectionResolverMode } from 'src/core/constants';
import {
  clearRouteTokens,
  getRouteTokens,
} from 'src/core/server/handlers/route.handler';
import { DependencyRegistration, WebServer } from 'src/core/types';
import BaseModule from '../base.module';
import { BaseRoute } from '../base.route';
import * as registrationFactory from '../di-registration-factory';

class TestModule extends BaseModule {
  registerDependencies = jest.fn<void, []>();
}

class TestService {}

class AnotherService {}

class TestRoute extends BaseRoute {
  registerRoutes(_webServer: WebServer): void {}
}

describe('BaseModule', () => {
  let module: TestModule;
  let makeDependencyRegistrationSpy: jest.SpyInstance;

  beforeEach(() => {
    module = new TestModule();
    clearRouteTokens();
    makeDependencyRegistrationSpy = jest.spyOn(
      registrationFactory,
      'makeDependencyRegistration',
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    clearRouteTokens();
  });

  describe('dependency collection lifecycle', () => {
    it('rebuilds the same ordered declarations on the first three calls', () => {
      module.registerDependencies.mockImplementation(() => {
        module.registerDependenciesByItems([
          ['singleton', TestService],
          ['scoped', AnotherService, InjectionResolverMode.SCOPED],
          ['transient', TestService, InjectionResolverMode.TRANSIENT],
          ['proxy', AnotherService, InjectionResolverMode.PROXY],
          ['classic', TestService, InjectionResolverMode.CLASSIC],
        ] as const);
      });

      const collections = Array.from({ length: 3 }, () =>
        module.getRegisterDependencies(),
      );

      expect(module.registerDependencies).toHaveBeenCalledTimes(3);
      for (const registrations of collections) {
        expect(registrations).toMatchObject([
          ['singleton', { lifetime: 'SINGLETON' }],
          ['scoped', { lifetime: 'SCOPED' }],
          ['transient', { lifetime: 'TRANSIENT' }],
          ['proxy', { lifetime: 'TRANSIENT', injectionMode: 'PROXY' }],
          ['classic', { lifetime: 'TRANSIENT', injectionMode: 'CLASSIC' }],
        ]);
      }
      expect(collections[1]).not.toBe(collections[0]);
      expect(collections[2]).not.toBe(collections[1]);
    });

    it('returns a snapshot unaffected by subsequent helper calls', () => {
      module.registerDependencies.mockImplementation(() => {
        module.registerSingleton('declared', TestService);
      });

      const registrations = module.getRegisterDependencies();
      module.registerSingleton('outside-declaration', AnotherService);

      expect(registrations.map(([token]) => token)).toEqual(['declared']);
      expect(module.getRegisterDependencies().map(([token]) => token)).toEqual([
        'declared',
      ]);
    });

    it('does not carry caller array mutations into the next collection', () => {
      module.registerDependencies.mockImplementation(() => {
        module
          .registerSingleton('first', TestService)
          .registerScoped('second', AnotherService);
      });

      // Simulate a JavaScript caller bypassing the readonly TypeScript API.
      const callerRegistrations =
        module.getRegisterDependencies() as DependencyRegistration[];
      callerRegistrations.reverse();
      callerRegistrations.pop();
      callerRegistrations.push(['caller', { resolve: () => undefined }]);

      expect(module.getRegisterDependencies().map(([token]) => token)).toEqual([
        'first',
        'second',
      ]);
      expect(callerRegistrations.map(([token]) => token)).toEqual([
        'second',
        'caller',
      ]);
    });

    it('returns an empty snapshot for an empty declaration on every call', () => {
      expect(module.getRegisterDependencies()).toEqual([]);
      expect(module.getRegisterDependencies()).toEqual([]);
      expect(module.registerDependencies).toHaveBeenCalledTimes(2);
    });

    it('rethrows the original failure and retries without partial registrations', () => {
      const registrationError = new Error('registration failed');
      let shouldFail = true;
      module.registerDependencies.mockImplementation(() => {
        module.registerSingleton('first', TestService);
        if (shouldFail) {
          throw registrationError;
        }
        module
          .registerScoped('second', AnotherService)
          .registerTransient('third', TestService);
      });

      let thrownError: unknown;
      try {
        module.getRegisterDependencies();
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBe(registrationError);

      shouldFail = false;
      for (let attempt = 0; attempt < 2; attempt++) {
        expect(
          module.getRegisterDependencies().map(([token]) => token),
        ).toEqual(['first', 'second', 'third']);
      }
    });
  });

  describe('generic registration helpers', () => {
    it('defaults omitted and undefined modes to singleton', () => {
      module
        .registerDependency('omitted', TestService)
        .registerDependency('undefined', AnotherService, undefined);

      expect(makeDependencyRegistrationSpy.mock.calls).toEqual([
        ['omitted', TestService, InjectionResolverMode.SINGLETON],
        ['undefined', AnotherService, InjectionResolverMode.SINGLETON],
      ]);
    });

    it.each(Object.values(InjectionResolverMode))(
      'forwards the explicit %s mode',
      (injectionMode) => {
        module.registerDependency('service', TestService, injectionMode);

        expect(makeDependencyRegistrationSpy).toHaveBeenCalledWith(
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

      module.registerDependencies.mockImplementation(() => {
        expect(module.registerDependenciesByItems(items)).toBe(module);
      });
      const registrations = module.getRegisterDependencies();

      expect(makeDependencyRegistrationSpy.mock.calls).toEqual([
        ['default', TestService, InjectionResolverMode.SINGLETON],
        ['scoped', AnotherService, InjectionResolverMode.SCOPED],
        ['transient', TestService, InjectionResolverMode.TRANSIENT],
        ['proxy', AnotherService, InjectionResolverMode.PROXY],
        ['classic', TestService, InjectionResolverMode.CLASSIC],
      ]);
      expect(registrations.map(([injectionToken]) => injectionToken)).toEqual([
        'default',
        'scoped',
        'transient',
        'proxy',
        'classic',
      ]);
    });
  });

  describe('lifetime-specific helpers', () => {
    it('registers and chains singleton, scoped, and transient dependencies', () => {
      const result = module
        .registerSingleton('singleton', TestService)
        .registerScoped('scoped', AnotherService)
        .registerTransient('transient', TestService);

      expect(result).toBe(module);
      expect(makeDependencyRegistrationSpy.mock.calls).toEqual([
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
      expect(makeDependencyRegistrationSpy.mock.calls).toEqual([
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
      expect(module.getRegisterDependencies()).toEqual([]);
      expect(makeDependencyRegistrationSpy).not.toHaveBeenCalled();
    });
  });

  it('preserves route tokens from every helper and other modules across rebuilds', () => {
    const otherModule = new TestModule();
    otherModule.registerDependencies.mockImplementation(() => {
      otherModule.registerSingleton('route:other-module', TestRoute);
    });
    otherModule.getRegisterDependencies();

    module.registerDependencies.mockImplementation(() => {
      const result = module
        .registerDependency('route:dependency', TestRoute)
        .registerDependenciesByItems([['route:items', TestRoute]] as const)
        .registerSingleton('route:singleton', TestRoute)
        .registerScoped('route:scoped', TestRoute)
        .registerTransient('route:transient', TestRoute)
        .registerSingletons([['route:singletons', TestRoute]] as const)
        .registerScopedDependencies([
          ['route:scoped-items', TestRoute],
        ] as const)
        .registerTransients([['route:transients', TestRoute]] as const)
        .registerSingleton('service', TestService);
      expect(result).toBe(module);
    });

    const expectedTokens = [
      'route:other-module',
      'route:dependency',
      'route:items',
      'route:singleton',
      'route:scoped',
      'route:transient',
      'route:singletons',
      'route:scoped-items',
      'route:transients',
    ];

    for (let attempt = 0; attempt < 3; attempt++) {
      module.getRegisterDependencies();
      expect(getRouteTokens()).toEqual(expectedTokens);
    }
  });

  it('converges route tokens after a partial registration failure and retry', () => {
    const registrationError = new Error('route registration failed');
    let shouldFail = true;
    module.registerDependencies.mockImplementation(() => {
      module.registerSingleton('route:first', TestRoute);
      if (shouldFail) {
        throw registrationError;
      }
      module
        .registerScoped('route:second', TestRoute)
        .registerSingleton('service', TestService);
    });

    expect(() => module.getRegisterDependencies()).toThrow(registrationError);
    expect(getRouteTokens()).toEqual(['route:first']);

    shouldFail = false;
    expect(module.getRegisterDependencies().map(([token]) => token)).toEqual([
      'route:first',
      'route:second',
      'service',
    ]);
    expect(getRouteTokens()).toEqual(['route:first', 'route:second']);
  });
});
