import { AppConfigType } from './app-config.types';
import { EnvironmentSchema, transformEnvironment } from './environment.schema';

export class EnvironmentService {
  private readonly config: AppConfigType;

  constructor() {
    const parsedEnvironment = EnvironmentSchema.parse(process.env);
    this.config = transformEnvironment(parsedEnvironment);
  }

  getConfig(): AppConfigType {
    return this.config;
  }
}
