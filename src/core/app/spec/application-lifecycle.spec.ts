import net from 'net';
import {
  ContainerTokens,
  Environment,
  InjectionResolverMode,
} from 'src/core/constants';
import { WebServerModule } from 'src/core/server';
import { clearRouteTokens } from 'src/core/server/handlers/route.handler';
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

jest.mock('src/core/config/logger.config', () => ({
  LoggerConfig: { production: { level: 'silent' } },
}));

/**
 * Stand-in for the shared database client: one instance per application,
 * released by the registration's disposer.
 */
class FakeDatabase {
  static instances: FakeDatabase[] = [];
  disposed = 0;
  queries = 0;

  constructor() {
    FakeDatabase.instances.push(this);
  }

  async query(): Promise<number> {
    if (this.disposed > 0) {
      throw new Error('query after dispose');
    }
    this.queries += 1;
    return this.queries;
  }

  async dispose(): Promise<void> {
    this.disposed += 1;
  }
}

class DatabaseRoute extends BaseRoute {
  registerRoutes(webServer: WebServer): void {
    webServer.get('/db', async (request) => {
      const database = request.diScope.resolve<FakeDatabase>(
        ContainerTokens.PRISMA,
      );
      return { queries: await database.query() };
    });
  }
}

class DatabaseRouteModule extends BaseModule {
  registerDependencies(): void {
    this.registerSingleton('databaseRoute', DatabaseRoute);
  }
}

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
  });
}

function globalConfig(
  port: number,
  database: {
    onInitiate?: (container: AppContainer) => Promise<void>;
    required?: boolean;
  },
  extraEntries: GlobalContainerConfigEntries = [],
): GlobalContainerConfigEntries {
  const config: AppConfigType = {
    appName: 'lifecycle-test',
    appEnv: Environment.PRODUCTION,
    appPort: port,
    serviceAuthName: 'x-test-key',
    secretKey: 'test-only',
  };
  class TestEnvironmentService {
    getConfig(): AppConfigType {
      return config;
    }
  }
  return [
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
    {
      containerTokens: ContainerTokens.PRISMA,
      globalContainerConfig: {
        service: FakeDatabase,
        mode: InjectionResolverMode.SINGLETON,
        required: database.required,
        onInitiate:
          database.onInitiate ??
          (async (container) => {
            await container
              .resolve<FakeDatabase>(ContainerTokens.PRISMA)
              .query();
          }),
        onDispose: (instance: FakeDatabase) => instance.dispose(),
      },
    },
    ...extraEntries,
  ];
}

async function createApp(
  entries: GlobalContainerConfigEntries,
  modules: IModule[] = [new DatabaseRouteModule()],
) {
  const app = await setupApp(entries, modules);
  app.registerStartupModule(new WebServerModule());
  return app;
}

describe('Application lifecycle with a required, disposable global service', () => {
  beforeEach(() => {
    FakeDatabase.instances = [];
    clearRouteTokens();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    clearRouteTokens();
  });

  it('keeps the singleton across requests and disposes it once on stop', async () => {
    const port = await getFreePort();
    const app = await createApp(globalConfig(port, { required: true }));

    await app.initialize();
    await app.start();
    const first = await (await fetch(`http://127.0.0.1:${port}/db`)).json();
    const second = await (await fetch(`http://127.0.0.1:${port}/db`)).json();
    const [database] = FakeDatabase.instances;

    expect(FakeDatabase.instances).toHaveLength(1);
    expect(first).toEqual({ queries: 2 });
    expect(second).toEqual({ queries: 3 });
    expect(database.disposed).toBe(0);

    await app.stop();

    expect(database.disposed).toBe(1);
    expect(FakeDatabase.instances).toHaveLength(1);
  });

  it('rejects initialize() with the original error of a required hook, after the other hooks settle', async () => {
    const port = await getFreePort();
    const original = new Error('database not ready');
    let slowHookFinished = false;
    const slowHook: GlobalContainerConfigEntries[number] = {
      containerTokens: ContainerTokens.PRISMA_CONFIG,
      globalContainerConfig: {
        service: class SlowService {},
        mode: InjectionResolverMode.SINGLETON,
        onInitiate: async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          slowHookFinished = true;
        },
      },
    };
    const app = await createApp(
      globalConfig(
        port,
        {
          required: true,
          onInitiate: async (container) => {
            container.resolve(ContainerTokens.PRISMA);
            throw original;
          },
        },
        [slowHook],
      ),
    );
    const start = jest.spyOn(app, 'start');

    await expect(app.initialize()).rejects.toBe(original);
    expect(slowHookFinished).toBe(true);
    expect(start).not.toHaveBeenCalled();

    // The composition root (index.ts) calls stop() after a startup failure.
    await app.stop();

    expect(FakeDatabase.instances).toHaveLength(1);
    expect(FakeDatabase.instances[0].disposed).toBe(1);
    await expect(fetch(`http://127.0.0.1:${port}/db`)).rejects.toThrow();
  });

  it('keeps logging and continuing when a hook that is not required fails', async () => {
    const port = await getFreePort();
    const app = await createApp(
      globalConfig(port, {
        onInitiate: async () => {
          throw new Error('optional hook failed');
        },
      }),
    );

    await expect(app.initialize()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(
        'Error occurred while executing onInitiate hook.',
      ),
    );
    await app.stop();
  });

  it('releases the resolved singleton when start() fails after initialize()', async () => {
    const blocker = net.createServer();
    await new Promise<void>((resolve) => blocker.listen(0, '::', resolve));
    const { port } = blocker.address() as net.AddressInfo;
    try {
      const app = await createApp(globalConfig(port, { required: true }));

      await app.initialize();
      await expect(app.start()).rejects.toMatchObject({ code: 'EADDRINUSE' });
      await app.stop();

      expect(FakeDatabase.instances).toHaveLength(1);
      expect(FakeDatabase.instances[0].disposed).toBe(1);
    } finally {
      await new Promise((resolve) => blocker.close(resolve));
    }
  });

  it('does not create or dispose a singleton that was never resolved', async () => {
    const port = await getFreePort();
    const app = await createApp(
      globalConfig(port, { onInitiate: async () => {} }),
      [],
    );

    await app.initialize();
    await app.stop();

    expect(FakeDatabase.instances).toHaveLength(0);
  });
});
