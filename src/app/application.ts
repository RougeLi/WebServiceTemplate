import { AwilixContainer } from 'awilix';
import { EnvironmentService } from 'src/config/environment.service';
import ContainerTokens from 'src/global/container-tokens';
import { IApplication } from './app.types';

export default class Application implements IApplication {
  constructor(private readonly container: AwilixContainer) {}

  async initialize(): Promise<void> {
    console.log('Application initialization started');
  }

  async start(): Promise<void> {
    console.log('Application starting...');

    const environmentService = this.container.resolve<EnvironmentService>(
      ContainerTokens.APP_CONFIG,
    );
    const config = environmentService.getConfig();

    console.log(
      'Application configuration successfully loaded:',
      JSON.stringify(config, undefined, 2),
    );
  }
}
