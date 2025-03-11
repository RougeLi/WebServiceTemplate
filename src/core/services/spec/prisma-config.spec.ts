import { asClass, AwilixContainer } from 'awilix';
import { getTestContainer } from 'test-utils/containers';
import { ContainerTokens, Environment } from 'src/core/constants';
import { AppConfigType } from '../../types';
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
});
