import { PrismaClient } from '@prisma/client';
import { IDBService } from 'src/core/types';
import { DbUtils } from 'src/core/utils';
import LoggerService from './logger.service';
import PrismaConfigService from './prisma.config';

const { setupLogging, getConnectMethod, getDisconnectMethod } = DbUtils;

export default class PrismaService extends PrismaClient implements IDBService {
  readonly connect: () => Promise<void>;
  readonly disconnect: () => Promise<void>;

  constructor(
    readonly logger: LoggerService,
    readonly prismaConfig: PrismaConfigService,
  ) {
    super(prismaConfig.prismaClientOptions);

    setupLogging(
      logger,
      prismaConfig.logLevels,
      prismaConfig.formatQueryEventOptions,
      this,
    );
    this.connect = getConnectMethod(logger, this);
    this.disconnect = getDisconnectMethod(logger, this);
  }
}
