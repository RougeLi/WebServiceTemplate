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
  redisConfig?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix: string;
    keySeparator: string;
  };
};

export type APPName = AppConfigType['appName'];

export type RedisConfig = AppConfigType['redisConfig'];
