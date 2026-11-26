import { asClass, asValue, AwilixContainer } from 'awilix';
import { getTestContainer } from 'test-utils/containers';
import { getEnvironmentServiceMock } from 'test-utils/mocks';
import { ContainerTokens, Environment } from 'src/core/constants';
import { DatabaseConfigurationError } from 'src/core/utils/db-utils';
import { AppConfigType } from '../../types';
import PrismaConfig, {
  DEFAULT_DATABASE_CONNECTION_TIMEOUT_MS,
  DEFAULT_DATABASE_POOL_MAX,
} from '../prisma.config';

describe('PrismaConfig', () => {
  let container: AwilixContainer;
  let prismaConfig: PrismaConfig;

  beforeEach(() => {
    container = getTestContainer();

    container.register(
      ContainerTokens.PRISMA_CONFIG,
      asClass(PrismaConfig).singleton(),
    );

    prismaConfig = container.resolve<PrismaConfig>(
      ContainerTokens.PRISMA_CONFIG,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLogLevels', () => {
    const testCases: Array<{
      description: string;
      config: AppConfigType;
      expectedLogLevels: string[];
    }> = [
      {
        description: 'Development environment without forcePrismaQueryLog',
        config: {
          appEnv: Environment.DEVELOPMENT,
          forcePrismaQueryLog: false,
        } as AppConfigType,
        expectedLogLevels: ['query', 'info', 'warn', 'error'],
      },
      {
        description: 'Development environment with forcePrismaQueryLog',
        config: {
          appEnv: Environment.DEVELOPMENT,
          forcePrismaQueryLog: true,
        } as AppConfigType,
        expectedLogLevels: ['query', 'info', 'warn', 'error'],
      },
      {
        description: 'Production environment without forcePrismaQueryLog',
        config: {
          appEnv: Environment.PRODUCTION,
          forcePrismaQueryLog: false,
        } as AppConfigType,
        expectedLogLevels: ['info', 'warn', 'error'],
      },
      {
        description: 'Production environment with forcePrismaQueryLog',
        config: {
          appEnv: Environment.PRODUCTION,
          forcePrismaQueryLog: true,
        } as AppConfigType,
        expectedLogLevels: ['query', 'info', 'warn', 'error'],
      },
      {
        description: 'Staging environment without forcePrismaQueryLog',
        config: {
          appEnv: Environment.STAGING,
          forcePrismaQueryLog: false,
        } as AppConfigType,
        expectedLogLevels: ['info', 'warn', 'error'],
      },
      {
        description: 'Staging environment with forcePrismaQueryLog',
        config: {
          appEnv: Environment.STAGING,
          forcePrismaQueryLog: true,
        } as AppConfigType,
        expectedLogLevels: ['query', 'info', 'warn', 'error'],
      },
    ];

    testCases.forEach(({ description, config, expectedLogLevels }) => {
      it(`should return ${expectedLogLevels} when ${description}`, () => {
        const logLevels = prismaConfig.getLogLevels(config);
        expect(logLevels).toEqual(expectedLogLevels);
      });
    });
  });

  describe('getErrorFormat', () => {
    const testCases: Array<{
      description: string;
      isDevelopment: boolean;
      expectedErrorFormat: 'pretty' | 'minimal';
    }> = [
      {
        description: 'when isDevelopment is true',
        isDevelopment: true,
        expectedErrorFormat: 'pretty',
      },
      {
        description: 'when isDevelopment is false',
        isDevelopment: false,
        expectedErrorFormat: 'minimal',
      },
    ];

    testCases.forEach(({ description, isDevelopment, expectedErrorFormat }) => {
      it(`should return ${expectedErrorFormat} ${description}`, () => {
        const errorFormat = prismaConfig.getErrorFormat(isDevelopment);
        expect(errorFormat).toEqual(expectedErrorFormat);
      });
    });
  });

  describe('getFormatQueryEventOptions', () => {
    const testCases: Array<{
      description: string;
      config: AppConfigType;
      expectedOptions: {
        forceQueryLog: boolean;
        maxStrLen: number | undefined;
        enableJsonParse: boolean | undefined;
        delimiter: string | undefined;
      };
    }> = [
      {
        description:
          'should return correct options when forcePrismaQueryLog is false',
        config: {
          forcePrismaQueryLog: false,
          prismaQueryMaxStrLen: 500,
          prismaQueryEnableJsonParse: false,
          prismaQueryDelimiter: ',',
        } as AppConfigType,
        expectedOptions: {
          forceQueryLog: false,
          maxStrLen: 500,
          enableJsonParse: false,
          delimiter: ',',
        },
      },
      {
        description:
          'should return correct options when forcePrismaQueryLog is true',
        config: {
          forcePrismaQueryLog: true,
          prismaQueryMaxStrLen: 1000,
          prismaQueryEnableJsonParse: true,
          prismaQueryDelimiter: '|',
        } as AppConfigType,
        expectedOptions: {
          forceQueryLog: true,
          maxStrLen: 1000,
          enableJsonParse: true,
          delimiter: '|',
        },
      },
    ];

    testCases.forEach(({ description, config, expectedOptions }) => {
      it(description, () => {
        const options = prismaConfig.getFormatQueryEventOptions(config);
        expect(options).toEqual(expectedOptions);
      });
    });
  });

  describe('database pool settings', () => {
    const resolveWithConfig = (config: Partial<AppConfigType>) => {
      const configuredContainer = getTestContainer();
      configuredContainer.register(
        ContainerTokens.ENVIRONMENT,
        asValue(
          getEnvironmentServiceMock({
            appEnv: Environment.PRODUCTION,
            ...config,
          }),
        ),
      );
      configuredContainer.register(
        ContainerTokens.PRISMA_CONFIG,
        asClass(PrismaConfig).singleton(),
      );
      return configuredContainer.resolve<PrismaConfig>(
        ContainerTokens.PRISMA_CONFIG,
      );
    };

    it('should default the pool to 10 connections and a 10 s connection timeout', () => {
      expect(DEFAULT_DATABASE_POOL_MAX).toBe(10);
      expect(DEFAULT_DATABASE_CONNECTION_TIMEOUT_MS).toBe(10000);
      expect(prismaConfig.databasePoolMax).toBe(10);
      expect(prismaConfig.databaseConnectionTimeoutMs).toBe(10000);
    });

    it('should use the configured pool size and connection timeout', () => {
      const config = resolveWithConfig({
        databasePoolMax: 3,
        databaseConnectionTimeoutMs: 2500,
      });
      expect(config.databasePoolMax).toBe(3);
      expect(config.databaseConnectionTimeoutMs).toBe(2500);
    });
  });

  describe('getDatabaseConnectionOptions', () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;

    afterEach(() => {
      if (originalDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalDatabaseUrl;
      }
    });

    it('should not read DATABASE_URL while the config is constructed', () => {
      delete process.env.DATABASE_URL;
      expect(() =>
        getTestContainer()
          .register(
            ContainerTokens.PRISMA_CONFIG,
            asClass(PrismaConfig).singleton(),
          )
          .resolve(ContainerTokens.PRISMA_CONFIG),
      ).not.toThrow();
    });

    it('should build the PrismaPg pool config from DATABASE_URL', () => {
      process.env.DATABASE_URL =
        ' postgresql://app:secret@db.example.com:5432/app_db ';
      expect(prismaConfig.getDatabaseConnectionOptions()).toEqual({
        poolConfig: {
          connectionString:
            'postgresql://app:secret@db.example.com:5432/app_db',
          max: 10,
          connectionTimeoutMillis: 10000,
        },
        adapterOptions: {},
        ignoredUrlParameters: [],
        warnings: [],
      });
    });

    it('should pass ?schema= to the adapter and warn that raw SQL keeps the search_path', () => {
      const options = prismaConfig.getDatabaseConnectionOptions(
        'postgresql://app:secret@db/app_db?schema=tenant_a',
      );
      expect(options.adapterOptions).toEqual({ schema: 'tenant_a' });
      expect(options.poolConfig).toEqual({
        connectionString: 'postgresql://app:secret@db/app_db?schema=tenant_a',
        max: 10,
        connectionTimeoutMillis: 10000,
      });
      expect(options.warnings).toEqual([
        expect.stringContaining('`schema` applies to model queries only'),
      ]);
      expect(options.warnings[0]).not.toContain('secret');
    });

    it('should not warn about raw SQL when the URL options set the same search_path', () => {
      const options = prismaConfig.getDatabaseConnectionOptions(
        'postgresql://app@db/app_db?schema=tenant_a&options=-c%20search_path%3Dtenant_a',
      );
      expect(options.adapterOptions).toEqual({ schema: 'tenant_a' });
      expect(options.warnings).toEqual([]);
    });

    it('should still warn when the URL options set a different search_path', () => {
      const options = prismaConfig.getDatabaseConnectionOptions(
        'postgresql://app@db/app_db?schema=tenant_a&options=-c%20search_path%3Dpublic',
      );
      expect(options.warnings).toEqual([
        expect.stringContaining('options=-c%20search_path%3D<schema>'),
      ]);
    });

    it('should warn about ignored Prisma 6 parameters without the URL', () => {
      const options = prismaConfig.getDatabaseConnectionOptions(
        'postgresql://app:secret@db/app_db?connection_limit=5',
      );
      expect(options.adapterOptions).toEqual({});
      expect(options.ignoredUrlParameters).toEqual(['connection_limit']);
      expect(options.warnings).toHaveLength(1);
      expect(options.warnings[0]).toContain('connection_limit');
      expect(options.warnings[0]).not.toContain('secret');
    });

    it.each([
      ['missing', undefined],
      ['blank', '  '],
      ['invalid', 'not-a-url'],
      ['not PostgreSQL', 'mysql://app:secret@db/app_db'],
    ])(
      'should throw a DatabaseConfigurationError when DATABASE_URL is %s',
      (_label, databaseUrl) => {
        if (databaseUrl === undefined) {
          delete process.env.DATABASE_URL;
        } else {
          process.env.DATABASE_URL = databaseUrl;
        }
        expect(() => prismaConfig.getDatabaseConnectionOptions()).toThrow(
          DatabaseConfigurationError,
        );
      },
    );
  });
});
