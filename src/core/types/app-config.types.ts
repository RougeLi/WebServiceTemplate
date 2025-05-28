import { Environment } from 'src/core/constants';

export type AppConfigType = {
  appName: string;
  appEnv: Environment;
  appPort: number;
  serviceAuthName: string;
  secretKey: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  forcePrismaQueryLog?: boolean;
  prismaQueryMaxStrLen?: number;
  prismaQueryEnableJsonParse?: boolean;
  prismaQueryDelimiter?: string;
};
