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
};
