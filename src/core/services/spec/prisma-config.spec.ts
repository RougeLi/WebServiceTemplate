import { asClass, AwilixContainer } from 'awilix';
import { getTestContainer } from 'test-utils/containers';
import { ContainerTokens, Environment } from 'src/core/constants';
import PrismaConfig from '../prisma.config';

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
    it('should return the correct log levels for the environment', () => {
      const logLevels = prismaConfig.getLogLevels(Environment.DEVELOPMENT);
      expect(logLevels).toEqual(['query', 'info', 'warn', 'error']);
    });

    it('should return the correct log levels for not development environment', () => {
      const logLevels = prismaConfig.getLogLevels(Environment.STAGING);
      expect(logLevels).toEqual(['info', 'warn', 'error']);
    });
  });

  describe('getErrorFormat', () => {
    it('should return pretty error format for development environment', () => {
      const errorFormat = prismaConfig.getErrorFormat(true);
      expect(errorFormat).toEqual('pretty');
    });

    it('should return minimal error format for not development environment', () => {
      const errorFormat = prismaConfig.getErrorFormat(false);
      expect(errorFormat).toEqual('minimal');
    });
  });
});
