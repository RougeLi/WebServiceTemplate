import { PrismaPg } from '@prisma/adapter-pg';
import { checkDatabaseCertificateFiles } from 'src/core/config/postgres-options';
import { IDBService } from 'src/core/types';
import { DbUtils } from 'src/core/utils';
import { PrismaClient } from 'src/generated/prisma/client';
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
    const { poolConfig, adapterOptions, warnings } =
      prismaConfig.getDatabaseConnectionOptions();
    super({
      ...prismaConfig.prismaClientOptions,
      adapter: new PrismaPg(poolConfig, adapterOptions),
    });

    setupLogging(
      logger,
      prismaConfig.logLevels,
      prismaConfig.formatQueryEventOptions,
      this,
    );
    const connect = getConnectMethod(logger, this);
    this.connect = async () => {
      for (const warning of warnings) {
        logger.warn(warning);
      }
      checkDatabaseCertificateFiles(poolConfig.connectionString);
      await connect();
    };
    this.disconnect = getDisconnectMethod(logger, this);
  }
}
