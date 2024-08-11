import { AppConfigType } from './app-config.types';

export class EnvironmentService {
  private readonly config: AppConfigType;

  constructor() {
    this.config = {
      appName: process.env.APP_NAME || 'ServiceTemplate',
    };
  }

  getConfig(): AppConfigType {
    return this.config;
  }
}
