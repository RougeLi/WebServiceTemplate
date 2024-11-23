import { EnvironmentSchema, transformEnvironment } from 'src/core/config';
import { Environment } from 'src/core/constants';
import { AppConfigType } from 'src/core/types';

export default class EnvironmentService {
  private readonly config: AppConfigType;

  constructor() {
    const parsedEnvironment = EnvironmentSchema.parse(process.env);
    this.config = transformEnvironment(parsedEnvironment);
  }

  getConfig(): AppConfigType {
    return this.config;
  }

  getAppEnv(): Environment {
    return this.config.appEnv;
  }

  isDevelopment(): boolean {
    return this.config.appEnv === Environment.DEVELOPMENT;
  }
}
