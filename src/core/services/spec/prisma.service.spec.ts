import { asClass, asValue, AwilixContainer } from 'awilix';
import { getTestContainer } from 'test-utils/containers';
import { ContainerTokens } from 'src/core/constants';
import { LoggerService } from 'src/core/services';
import { DbUtils } from 'src/core/utils';
import PrismaConfig from '../prisma.config';
import PrismaService from '../prisma.service';

jest.mock('src/core/utils/db-utils', () => ({
  setupLogging: jest.fn(),
  getConnectMethod: jest.fn(),
  getDisconnectMethod: jest.fn(),
}));

type ServiceClassType<T> = new (
  logger: LoggerService,
  prismaConfig: PrismaConfig,
) => T;

const setupServiceTest = <T>(
  token: string,
  ServiceClass: ServiceClassType<T>,
) => {
  it(`should initialize ${ServiceClass.name} with logging and connect/disconnect methods`, () => {
    const container: AwilixContainer = getTestContainer();

    const commonPrismaConfig = {
      prismaClientOptions: {
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'info' },
        ],
      },
      logLevels: ['query', 'info', 'warn', 'error'],
      formatQueryEventOptions: {
        forceQueryLog: true,
        maxStrLen: 1000,
        enableJsonParse: true,
        delimiter: ',',
      },
    };

    container.register(
      ContainerTokens.PRISMA_CONFIG,
      asValue(commonPrismaConfig),
    );

    container.register(token, asClass(ServiceClass).singleton());

    const serviceInstance = container.resolve<T>(token);

    expect(DbUtils.setupLogging).toHaveBeenCalledWith(
      expect.any(LoggerService),
      commonPrismaConfig.logLevels,
      commonPrismaConfig.formatQueryEventOptions,
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
};

describe('Prisma Services', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    describe('BackofficePrismaService', () => {
      setupServiceTest('prismaService', PrismaService);
    });
  });
});
