import { EnvironmentSchema, transformEnvironment } from 'src/core/config';
import { Environment } from 'src/core/constants';
import { AppConfigType } from 'src/core/types';

export default class EnvironmentService {
  private readonly config: AppConfigType;

  private readonly databaseUrl?: string;

  constructor() {
    const parsedEnvironment = EnvironmentSchema.parse(process.env);
    this.databaseUrl = parsedEnvironment.DATABASE_URL;
    this.config = transformEnvironment(parsedEnvironment);
  }

  /** Keeps the connection string out of the general application config. */
  getDatabaseUrl(): string | undefined {
    return this.databaseUrl;
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
