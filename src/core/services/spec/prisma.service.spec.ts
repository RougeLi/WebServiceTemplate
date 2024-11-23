import { PrismaClient } from '@prisma/client';
import { asClass, asValue, AwilixContainer } from 'awilix';
import { getTestContainer } from 'test-utils/containers';
import { ContainerTokens } from 'src/core/constants';
import { LoggerService } from 'src/core/services';
import { PrismaQueryEvent } from 'src/core/types';
import PrismaService from '../prisma.service';

describe('PrismaService', () => {
  let container: AwilixContainer;
  let loggerService: LoggerService;
  let prismaService: PrismaService;

  beforeEach(() => {
    jest
      .spyOn(PrismaClient.prototype, '$connect')
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(PrismaClient.prototype, '$disconnect')
      .mockImplementation(() => Promise.resolve());
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(() => {});

    container = getTestContainer();

    container.register(
      ContainerTokens.PRISMA_CONFIG,
      asValue({
        prismaClientOptions: {
          log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ],
        },
        logLevels: ['query', 'info', 'warn', 'error'],
      }),
    );
    container.register(
      ContainerTokens.PRISMA,
      asClass(PrismaService).singleton(),
    );

    loggerService = container.resolve<LoggerService>(ContainerTokens.LOGGER);
    prismaService = container.resolve<PrismaService>(ContainerTokens.PRISMA);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect to the database', async () => {
      const connectSpy = jest.spyOn(prismaService, '$connect');
      const infoSpy = jest.spyOn(loggerService, 'info');
      await prismaService.connect();
      expect(connectSpy).toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalledWith('Database connection established.');
    });

    it('should log an error if the connection fails', async () => {
      const error = { message: 'Authentication error' };
      const errorSpy = jest.spyOn(loggerService, 'error');
      jest.spyOn(prismaService, '$connect').mockRejectedValue(error);
      await expect(prismaService.connect()).rejects.toEqual(error);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to connect to the database due to authentication error.',
      );
    });

    it('should retry the connection if it fails', async () => {
      const error = { message: 'Connection error' };
      const warnSpy = jest.spyOn(loggerService, 'warn');
      jest.spyOn(prismaService, '$connect').mockRejectedValueOnce(error);
      await prismaService.connect();
      expect(warnSpy).toHaveBeenCalledWith(
        'Attempt 1 failed: Connection error',
      );
    });
  });

  describe('disconnect', () => {
    it('should disconnect from the database', async () => {
      const disconnectSpy = jest.spyOn(loggerService, 'info');
      jest.spyOn(prismaService, '$disconnect').mockResolvedValue();
      await prismaService.disconnect();
      expect(prismaService.$disconnect).toHaveBeenCalled();
      expect(disconnectSpy).toHaveBeenCalledWith(
        'Disconnected from the database.',
      );
    });

    it('should log an error if the disconnection fails', async () => {
      const error = { message: 'Disconnection error' };
      const errorSpy = jest.spyOn(loggerService, 'error');
      jest.spyOn(prismaService, '$disconnect').mockRejectedValue(error);
      await expect(prismaService.disconnect()).rejects.toEqual(error);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to disconnect from the database. Error: Disconnection error',
      );
    });
  });

  describe('outputQueryEventMessage', () => {
    it('should output the query event message', () => {
      const query = 'SELECT * FROM users';
      const params = ['param1', 'param2'];
      const duration = 100;
      const event = { query, params, duration };
      const result = prismaService.outputQueryEventMessage(
        event as unknown as PrismaQueryEvent,
      );
      expect(result).toEqual(
        'Query executed in 100 ms:\nSELECT * FROM users\nParams:\nparam1,param2\n---',
      );
    });
  });

  describe('formatParams', () => {
    it('should formatted normal output', () => {
      const params = `{"a": "b"}`;
      const result = prismaService.formatParams(params);
      expect(result).toEqual('{\n  "a": "b"\n}');
    });

    it('should formatted length more than 1000', () => {
      let params: any = {};
      const value = 'a'.repeat(10);
      for (let i = 0; i < 44; i++) {
        params[`a${i}`] = value;
      }
      const result = prismaService.formatParams(JSON.stringify(params));
      expect(result).toEqual(
        JSON.stringify(params, null, 2).substring(0, 1000) + '... (truncated)',
      );
    });

    it('should JSON.parse throws an error', () => {
      const params = `{"a": ${'a'.repeat(10)},}`;
      const result = prismaService.formatParams(params);
      expect(result).toEqual(params);
    });

    it('should formatted length less than 1000 and JSON.parse throws an error', () => {
      const params = `{"a": ${'a'.repeat(993)},}`;
      const result = prismaService.formatParams(params);
      expect(result).toEqual(`{"a": ${'a'.repeat(993)},... (truncated)`);
    });
  });

  describe('truncateLongStrings', () => {
    it('should truncate long strings', () => {
      const str = 'a'.repeat(110);
      const result = PrismaService.truncateLongStrings('', str);
      expect(result).toEqual('a'.repeat(100) + '... (truncated)');
    });

    it('should not truncate short strings', () => {
      const str = 'a'.repeat(10);
      const result = PrismaService.truncateLongStrings('', str);
      expect(result).toEqual('a'.repeat(10));
    });
  });
});
