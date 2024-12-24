import { Environment } from 'src/core/constants';

export type AppConfigType = {
  appName: string;
  appEnv: Environment;
  appPort: number;
  serviceToken: string;
};
