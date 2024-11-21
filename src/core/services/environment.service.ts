import { EnvironmentSchema, transformEnvironment } from 'src/core/config';
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
}
