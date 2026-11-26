import { Environment } from 'src/core/constants';

export type AppConfigType = {
  appName: string;
  appEnv: Environment;
  appPort: number;
  serviceAuthName: string;
  secretKey: string;
  forcePrismaQueryLog?: boolean;
  prismaQueryMaxStrLen?: number;
  prismaQueryEnableJsonParse?: boolean;
  prismaQueryDelimiter?: string;
  /** DATABASE_POOL_MAX; PrismaConfig defaults it to 10. */
  databasePoolMax?: number;
  /** DATABASE_CONNECTION_TIMEOUT_MS; PrismaConfig defaults it to 10000. */
  databaseConnectionTimeoutMs?: number;
};
