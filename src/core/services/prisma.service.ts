import { PrismaClient } from '@prisma/client';
import { LoggerService } from 'src/core/services';
import { PrismaConfigService } from 'src/core/services';
import { IDBService } from 'src/core/types';
import { DbUtils } from 'src/core/utils';

const { setupLogging, getConnectMethod, getDisconnectMethod } = DbUtils;

export default class PrismaService extends PrismaClient implements IDBService {
  readonly connect: () => Promise<void>;
  readonly disconnect: () => Promise<void>;

  constructor(
    readonly logger: LoggerService,
    readonly prismaConfig: PrismaConfigService,
  ) {
    super(prismaConfig.prismaClientOptions);

    setupLogging(logger, prismaConfig.logLevels, this);
    this.connect = getConnectMethod(logger, this);
    this.disconnect = getDisconnectMethod(logger, this);
  }
}
