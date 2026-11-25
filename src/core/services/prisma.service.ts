import { PrismaPg } from '@prisma/adapter-pg';
import { IDBService } from 'src/core/types';
import { DbUtils } from 'src/core/utils';
import { PrismaClient } from 'src/generated/prisma/client';
import LoggerService from './logger.service';
import PrismaConfigService from './prisma.config';

const { setupLogging, getConnectMethod, getDisconnectMethod } = DbUtils;

/**
 * Builds the Prisma Client options with a `PrismaPg` driver adapter.
 * Creating the adapter does not open a connection; the pool connects lazily
 * on the first query.
 */
function createClientOptions(
  logger: LoggerService,
  prismaConfig: PrismaConfigService,
) {
  const { poolConfig, adapterOptions, ignoredUrlParameters } =
    prismaConfig.getDatabaseConnectionOptions();

  if (ignoredUrlParameters.length > 0) {
    logger.warn(
      `DATABASE_URL contains Prisma 6 parameters that the PostgreSQL driver adapter ignores: ${ignoredUrlParameters.join(', ')}. ` +
        'Use DATABASE_POOL_MAX and DATABASE_CONNECTION_TIMEOUT_MS to configure the pool.',
    );
  }

  return {
    ...prismaConfig.prismaClientOptions,
    adapter: new PrismaPg(poolConfig, adapterOptions),
  };
}

export default class PrismaService extends PrismaClient implements IDBService {
  readonly connect: () => Promise<void>;
  readonly disconnect: () => Promise<void>;

  constructor(
    readonly logger: LoggerService,
    readonly prismaConfig: PrismaConfigService,
  ) {
    super(createClientOptions(logger, prismaConfig));

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
