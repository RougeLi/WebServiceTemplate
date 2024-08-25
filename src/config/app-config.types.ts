import { Environment } from 'src/global/types/environment.types';

export type AppConfigType = {
  appName: string;
  appEnv: Environment;
  appDomain: string;
  appPort: number;
  serviceToken: string;
};
