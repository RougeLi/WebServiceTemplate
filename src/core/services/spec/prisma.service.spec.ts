import { PrismaPg } from '@prisma/adapter-pg';
import { asClass, asValue, AwilixContainer } from 'awilix';
import { getTestContainer } from 'test-utils/containers';
import {
  ContainerTokens,
  Environment,
  InjectionResolverMode,
} from 'src/core/constants';
import { LoggerService } from 'src/core/services';
import { DatabaseConnectionOptions, IDBService } from 'src/core/types';
import { DbUtils, makeContainerRegistration } from 'src/core/utils';
import PrismaConfig from '../prisma.config';
import PrismaService from '../prisma.service';

jest.mock('src/core/utils/db-utils', () => {
  const actual = jest.requireActual('src/core/utils/db-utils');
  return {
    ...actual,
    __esModule: true,
    // `DbUtils` is the default export; keep the real URL validation.
    default: {
      ...actual.default,
      setupLogging: jest.fn(),
      getConnectMethod: jest.fn(),
      getDisconnectMethod: jest.fn(),
    },
  };
});

// A URL whose host is never contacted: creating the adapter is lazy.
const UNUSED_DATABASE_URL =
  'postgresql://app:secret@db.invalid:5432/app_db?schema=tenant_a';

function connectionOptions(
  overrides: Partial<DatabaseConnectionOptions> = {},
): DatabaseConnectionOptions {
  return {
    poolConfig: {
      connectionString: UNUSED_DATABASE_URL,
      max: 4,
      connectionTimeoutMillis: 1500,
    },
    adapterOptions: { schema: 'tenant_a' },
    ignoredUrlParameters: [],
    ...overrides,
  };
}

function prismaConfigMock(options = connectionOptions()) {
  return {
    prismaClientOptions: {
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
      ],
      errorFormat: 'minimal',
    },
    logLevels: ['query', 'info', 'warn', 'error'],
    formatQueryEventOptions: {
      forceQueryLog: true,
      maxStrLen: 1000,
      enableJsonParse: true,
      delimiter: ',',
    },
    getDatabaseConnectionOptions: jest.fn().mockReturnValue(options),
  };
}

describe('PrismaService', () => {
  let container: AwilixContainer;

  beforeEach(() => {
    container = getTestContainer();
  });

  afterEach(async () => {
    await container.dispose();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should initialize with logging and connect/disconnect methods', () => {
    const prismaConfig = prismaConfigMock();
    container.register(ContainerTokens.PRISMA_CONFIG, asValue(prismaConfig));
    container.register(
      ContainerTokens.PRISMA,
      asClass(PrismaService).singleton(),
    );

    const serviceInstance = container.resolve<PrismaService>(
      ContainerTokens.PRISMA,
    );

    expect(prismaConfig.getDatabaseConnectionOptions).toHaveBeenCalledTimes(1);
    expect(DbUtils.setupLogging).toHaveBeenCalledWith(
      expect.any(LoggerService),
      prismaConfig.logLevels,
      prismaConfig.formatQueryEventOptions,
      serviceInstance,
    );
    expect(DbUtils.getConnectMethod).toHaveBeenCalledWith(
      expect.any(LoggerService),
      serviceInstance,
    );
    expect(DbUtils.getDisconnectMethod).toHaveBeenCalledWith(
      expect.any(LoggerService),
      serviceInstance,
    );
  });

  it('should keep the Prisma Client API for consumers', () => {
    container.register(
      ContainerTokens.PRISMA_CONFIG,
      asValue(prismaConfigMock()),
    );
    container.register(
      ContainerTokens.PRISMA,
      asClass(PrismaService).singleton(),
    );

    const prisma = container.resolve<PrismaService>(ContainerTokens.PRISMA);

    expect(typeof prisma.log.findMany).toBe('function');
    expect(typeof prisma.$transaction).toBe('function');
    expect(typeof prisma.$queryRaw).toBe('function');
  });

  it('should not open a database connection when the Client is created', () => {
    const adapterConnect = jest.spyOn(PrismaPg.prototype, 'connect');
    container.register(
      ContainerTokens.PRISMA_CONFIG,
      asValue(prismaConfigMock()),
    );
    container.register(
      ContainerTokens.PRISMA,
      asClass(PrismaService).singleton(),
    );

    container.resolve(ContainerTokens.PRISMA);

    expect(adapterConnect).not.toHaveBeenCalled();
  });

  it('should warn about ignored Prisma 6 URL parameters without logging the URL', () => {
    container.register(
      ContainerTokens.PRISMA_CONFIG,
      asValue(
        prismaConfigMock(
          connectionOptions({
            ignoredUrlParameters: ['connection_limit', 'pool_timeout'],
          }),
        ),
      ),
    );
    container.register(
      ContainerTokens.PRISMA,
      asClass(PrismaService).singleton(),
    );
    const logger = container.resolve<LoggerService>(ContainerTokens.LOGGER);
    const warn = jest.spyOn(logger, 'warn');

    container.resolve(ContainerTokens.PRISMA);

    expect(warn).toHaveBeenCalledTimes(1);
    const [message] = warn.mock.calls[0];
    expect(message).toContain('connection_limit, pool_timeout');
    expect(message).toContain('DATABASE_POOL_MAX');
    expect(message).not.toContain('secret');
    expect(message).not.toContain('db.invalid');
  });

  it('should not warn when DATABASE_URL has no ignored parameters', () => {
    container.register(
      ContainerTokens.PRISMA_CONFIG,
      asValue(prismaConfigMock()),
    );
    container.register(
      ContainerTokens.PRISMA,
      asClass(PrismaService).singleton(),
    );
    const logger = container.resolve<LoggerService>(ContainerTokens.LOGGER);
    const warn = jest.spyOn(logger, 'warn');

    container.resolve(ContainerTokens.PRISMA);

    expect(warn).not.toHaveBeenCalled();
  });

  describe('with the real PrismaConfig', () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;

    beforeEach(() => {
      container.register(
        ContainerTokens.PRISMA_CONFIG,
        asClass(PrismaConfig).singleton(),
      );
      container.register(
        ContainerTokens.PRISMA,
        asClass(PrismaService).singleton(),
      );
    });

    afterEach(() => {
      if (originalDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalDatabaseUrl;
      }
    });

    it.each([
      ['missing', undefined],
      ['blank', ' '],
      ['not a URL', 'not-a-url'],
    ])(
      'should fail on resolve, before an adapter is created, when DATABASE_URL is %s',
      (_label, databaseUrl) => {
        if (databaseUrl === undefined) {
          delete process.env.DATABASE_URL;
        } else {
          process.env.DATABASE_URL = databaseUrl;
        }
        const adapterConnect = jest.spyOn(PrismaPg.prototype, 'connect');

        expect(() => container.resolve(ContainerTokens.PRISMA)).toThrow(
          expect.objectContaining({ name: 'DatabaseConfigurationError' }),
        );
        expect(adapterConnect).not.toHaveBeenCalled();
      },
    );

    it('should create the Client when DATABASE_URL is valid', () => {
      process.env.DATABASE_URL = UNUSED_DATABASE_URL;
      // Prisma Client constructors return their own object (Prisma 6 and 7),
      // so `instanceof PrismaService` is false; check the contract instead.
      const prisma = container.resolve<PrismaService>(ContainerTokens.PRISMA);
      expect(prisma.constructor).toBe(PrismaService);
      expect(typeof prisma.log.findMany).toBe('function');
    });
  });

  describe('dependency injection', () => {
    beforeEach(() => {
      container.register(
        ContainerTokens.PRISMA_CONFIG,
        asValue(prismaConfigMock()),
      );
      const [token, resolver] = makeContainerRegistration(
        ContainerTokens.PRISMA,
        PrismaService,
        InjectionResolverMode.SINGLETON,
      );
      container.register(token, resolver);
    });

    it('should share one Client (and pool) across resolves and request scopes', () => {
      const fromRoot = container.resolve<PrismaService>(ContainerTokens.PRISMA);
      const scope = container.createScope();
      const fromScope = scope.resolve<PrismaService>(ContainerTokens.PRISMA);
      const fromOtherScope = container
        .createScope()
        .resolve<PrismaService>(ContainerTokens.PRISMA);

      expect(fromRoot).toBe(container.resolve(ContainerTokens.PRISMA));
      expect(fromScope).toBe(fromRoot);
      expect(fromOtherScope).toBe(fromRoot);
    });

    it('should allow tests to replace the Client with a fake', () => {
      const fake: IDBService = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
      };
      const testContainer = getTestContainer();
      testContainer.register(ContainerTokens.PRISMA, asValue(fake));

      expect(testContainer.resolve(ContainerTokens.PRISMA)).toBe(fake);
    });
  });

  it('should not require DATABASE_URL for environments that never resolve the Client', () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const testContainer = getTestContainer();
      testContainer.register(
        ContainerTokens.PRISMA_CONFIG,
        asClass(PrismaConfig).singleton(),
      );
      testContainer.register(
        ContainerTokens.PRISMA,
        asClass(PrismaService).singleton(),
      );
      expect(
        testContainer.resolve<PrismaConfig>(ContainerTokens.PRISMA_CONFIG)
          .appEnv,
      ).toBe(Environment.DEVELOPMENT);
    } finally {
      if (originalDatabaseUrl !== undefined) {
        process.env.DATABASE_URL = originalDatabaseUrl;
      }
    }
  });
});
