import {
  ContainerTokens,
  Environment,
  InjectionResolverMode,
} from 'src/core/constants';
import { createWebServer } from 'src/core/server/bootstrap/web-server';
import {
  clearRouteTokens,
  getRouteTokens,
  registerRoutes,
} from 'src/core/server/handlers/route.handler';
import { LoggerService } from 'src/core/services';
import {
  AppConfigType,
  AppContainer,
  GlobalContainerConfigEntries,
  IModule,
  WebServer,
} from 'src/core/types';
import BaseModule from 'src/core/utils/base.module';
import { BaseRoute } from 'src/core/utils/base.route';
import setupApp from '../setup-app';

class TestService {
  label = 'initial';
}

class RequestService {
  constructor(readonly service: TestService) {}
}

class TestRoute extends BaseRoute {
  constructor(private readonly service: TestService) {
    super();
  }

  registerRoutes(webServer: WebServer): void {
    webServer.get('/service', (request) => {
      const requestService =
        request.diScope.resolve<RequestService>('requestService');
      return {
        label: requestService.service.label,
        matchesRoute: requestService.service === this.service,
        matchesApp:
          requestService.service === webServer.diContainer.resolve('service'),
        sameScope: requestService === request.diScope.resolve('requestService'),
      };
    });
  }
}

class ServiceModule extends BaseModule {
  registerDependencies(): void {
    this.registerSingleton('service', TestService).registerScoped(
      'requestService',
      RequestService,
    );
  }
}

class RouteModule extends BaseModule {
  registerDependencies(): void {
    this.registerSingleton('route', TestRoute);
  }
}

const config: AppConfigType = {
  appName: 'module-reuse-test',
  appEnv: Environment.PRODUCTION,
  appPort: 0,
  serviceAuthName: 'x-test-key',
  secretKey: 'test-only',
};

class TestEnvironmentService {
  getConfig(): AppConfigType {
    return config;
  }
}

describe('setupApp with reused module instances', () => {
  const containers: AppContainer[] = [];
  const webServers: WebServer[] = [];

  beforeEach(() => {
    clearRouteTokens();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    for (const webServer of webServers.splice(0)) {
      await webServer.close();
    }
    for (const container of containers.splice(0)) {
      await container.dispose();
    }
    jest.restoreAllMocks();
    clearRouteTokens();
  });

  async function initializeApp(
    modules: IModule[],
    globalConfig: GlobalContainerConfigEntries = [],
  ): Promise<AppContainer> {
    const app = await setupApp(globalConfig, modules);
    const startup = {
      name: 'capture-container',
      initialize: jest.fn(async (container: AppContainer) => {
        containers.push(container);
      }),
      start: async () => {},
      stop: async () => {},
    };
    app.registerStartupModule(startup);
    await app.initialize();
    return startup.initialize.mock.calls[0][0];
  }

  it('rebuilds each module once per app and uses separate singleton caches', async () => {
    const serviceModule = new ServiceModule();
    const routeModule = new RouteModule();
    const modules = [serviceModule, routeModule];
    const collectServices = jest.spyOn(
      serviceModule,
      'getRegisterDependencies',
    );
    const collectRoutes = jest.spyOn(routeModule, 'getRegisterDependencies');

    const firstContainer = await initializeApp(modules);
    const firstService = firstContainer.resolve<TestService>('service');
    const firstRegistrations = collectServices.mock.results[0].value;
    const secondContainer = await initializeApp(modules);
    const secondService = secondContainer.resolve<TestService>('service');

    expect(collectServices).toHaveBeenCalledTimes(2);
    expect(collectRoutes).toHaveBeenCalledTimes(2);
    for (let call = 0; call < 2; call++) {
      expect(collectServices.mock.results[call].value).toHaveLength(2);
      expect(collectRoutes.mock.results[call].value).toHaveLength(1);
    }
    expect(firstRegistrations).toHaveLength(2);
    expect(secondContainer).not.toBe(firstContainer);
    expect(secondService).not.toBe(firstService);
    expect(firstContainer.resolve('service')).toBe(firstService);
    expect(secondContainer.resolve('service')).toBe(secondService);
    expect(getRouteTokens()).toEqual(['route']);
    for (const container of [firstContainer, secondContainer]) {
      const requestService =
        container.resolve<RequestService>('requestService');
      expect(requestService.service).toBe(container.resolve('service'));
      expect(Object.keys(container.registrations)).toEqual([
        'service',
        'requestService',
        'route',
      ]);
    }
  });

  it('uses each app container for Fastify route and request-scope resolution', async () => {
    const modules = [new ServiceModule(), new RouteModule()];
    const globalConfig: GlobalContainerConfigEntries = [
      {
        containerTokens: ContainerTokens.ENVIRONMENT,
        globalContainerConfig: {
          service: TestEnvironmentService,
          mode: InjectionResolverMode.SINGLETON,
        },
      },
      {
        containerTokens: ContainerTokens.LOGGER,
        globalContainerConfig: {
          service: LoggerService,
          mode: InjectionResolverMode.SINGLETON,
        },
      },
    ];
    const firstContainer = await initializeApp(modules, globalConfig);
    const secondContainer = await initializeApp(modules, globalConfig);

    for (const [index, container] of [
      firstContainer,
      secondContainer,
    ].entries()) {
      container.resolve<TestService>('service').label = `app-${index}`;
      const webServer = await createWebServer(container, config);
      webServers.push(webServer);
      webServer.log.level = 'silent';
      registerRoutes(container, webServer);
    }

    for (const [index, webServer] of webServers.entries()) {
      expect(webServer.diContainer).toBe(containers[index]);
      const response = await webServer.inject('/service');
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        label: `app-${index}`,
        matchesRoute: true,
        matchesApp: true,
        sameScope: true,
      });
    }
    expect(getRouteTokens()).toEqual(['route']);
  });
});
