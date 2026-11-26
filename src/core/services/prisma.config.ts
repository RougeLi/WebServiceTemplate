import { Environment } from 'src/core/constants';
import {
  AppConfigType,
  DatabaseConnectionOptions,
  FormatQueryEventOptions,
  PrismaClientOptions,
  PrismaErrorFormat,
  PrismaLogLevels,
  PrismaPgPoolConfig,
} from 'src/core/types';
import { parseDatabaseUrl } from 'src/core/utils/db-utils';
import EnvironmentService from './environment.service';

/** pg default pool size (Prisma 6 used CPU count × 2 + 1). */
export const DEFAULT_DATABASE_POOL_MAX = 10;

/**
 * Maximum time to establish a connection or wait for a free pool slot.
 * pg's own default (0) never times out.
 */
export const DEFAULT_DATABASE_CONNECTION_TIMEOUT_MS = 10000;

export default class PrismaConfig {
  public readonly appEnv: Environment;
  public readonly logLevels: PrismaLogLevels;
  public readonly errorFormat: PrismaErrorFormat;
  public readonly prismaClientOptions: PrismaClientOptions;
  public readonly formatQueryEventOptions: FormatQueryEventOptions;
  public readonly databasePoolMax: number;
  public readonly databaseConnectionTimeoutMs: number;

  constructor(private readonly environment: EnvironmentService) {
    const config = this.environment.getConfig();
    const isDevelopment = this.environment.isDevelopment();
    this.appEnv = config.appEnv;
    this.logLevels = this.getLogLevels(config);
    this.errorFormat = this.getErrorFormat(isDevelopment);
    this.prismaClientOptions = {
      log: this.logLevels.map((level) => ({
        emit: 'event',
        level,
      })),
      errorFormat: this.errorFormat,
    };
    this.formatQueryEventOptions = this.getFormatQueryEventOptions(config);
    this.databasePoolMax = config.databasePoolMax ?? DEFAULT_DATABASE_POOL_MAX;
    this.databaseConnectionTimeoutMs =
      config.databaseConnectionTimeoutMs ??
      DEFAULT_DATABASE_CONNECTION_TIMEOUT_MS;
  }

  getLogLevels({
    appEnv,
    forcePrismaQueryLog,
  }: AppConfigType): PrismaLogLevels {
    const isDevelopment = appEnv === Environment.DEVELOPMENT;

    const baseLogLevels: PrismaLogLevels = ['info', 'warn', 'error'];

    if (isDevelopment || forcePrismaQueryLog) {
      return ['query', ...baseLogLevels];
    }

    return baseLogLevels;
  }

  getErrorFormat(isDevelopment: boolean): PrismaErrorFormat {
    return isDevelopment ? 'pretty' : 'minimal';
  }

  getFormatQueryEventOptions({
    forcePrismaQueryLog,
    prismaQueryMaxStrLen,
    prismaQueryEnableJsonParse,
    prismaQueryDelimiter,
  }: AppConfigType): FormatQueryEventOptions {
    const forceQueryLog = forcePrismaQueryLog;
    const maxStrLen = prismaQueryMaxStrLen;
    const enableJsonParse = prismaQueryEnableJsonParse;
    const delimiter = prismaQueryDelimiter;
    return {
      forceQueryLog,
      maxStrLen,
      enableJsonParse,
      delimiter,
    };
  }

  /**
   * Builds the `PrismaPg` pool and adapter options from DATABASE_URL.
   *
   * DATABASE_URL is read and validated here, when the Prisma Client is about
   * to be created, not when this config is constructed, so code paths that
   * never resolve the Client (unit tests, build) do not need it.
   *
   * `?schema=` is passed as the adapter's `schema` option, which qualifies
   * model queries. Raw SQL keeps the connection's `search_path` (Prisma 6 ran
   * `SET search_path`), so a warning is logged unless the URL's `options`
   * parameter sets the search_path itself.
   *
   * @throws DatabaseConfigurationError when DATABASE_URL is missing or invalid.
   */
  getDatabaseConnectionOptions(
    databaseUrl: string | undefined = process.env.DATABASE_URL,
  ): DatabaseConnectionOptions {
    const { connectionString, schema, ignoredParameters, setsSearchPath } =
      parseDatabaseUrl(databaseUrl);
    const warnings: string[] = [];

    const poolConfig: PrismaPgPoolConfig = {
      connectionString,
      max: this.databasePoolMax,
      connectionTimeoutMillis: this.databaseConnectionTimeoutMs,
    };

    if (schema && !setsSearchPath) {
      warnings.push(
        'DATABASE_URL `schema` applies to model queries only; raw SQL ($queryRaw, $executeRaw) uses the connection search_path. ' +
          'Schema-qualify raw SQL, or add `options=-c search_path=<schema>` to DATABASE_URL when connecting directly to PostgreSQL.',
      );
    }

    if (ignoredParameters.length > 0) {
      warnings.push(
        `DATABASE_URL contains Prisma 6 parameters that the PostgreSQL driver adapter ignores: ${ignoredParameters.join(', ')}. ` +
          'Use DATABASE_POOL_MAX and DATABASE_CONNECTION_TIMEOUT_MS to configure the pool.',
      );
    }

    return {
      poolConfig,
      adapterOptions: schema ? { schema } : {},
      ignoredUrlParameters: ignoredParameters,
      warnings,
    };
  }
}
