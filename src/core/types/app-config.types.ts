import { Environment } from 'src/core/constants';

export type AppConfigType = {
  appName: string;
  appEnv: Environment;
  appDomain: string;
  appPort: number;
  serviceToken: string;
};
