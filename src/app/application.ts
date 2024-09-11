import { AppConfigType } from 'src/config/app-config.types';
import ContainerTokens from 'src/global/container-tokens';
import { AppContainer, WebServer } from 'src/global/types/framework.types';
import { registerModulesRoutes } from 'src/modules';
import createWeb from 'src/server/web-server';
import { IApplication } from './app.types';
import { EnvironmentService } from '../config/environment.service';

export default class Application implements IApplication {
  private environmentService: EnvironmentService;
  private readonly config: AppConfigType;
  private webServer: WebServer;

  constructor(private readonly container: AppContainer) {
    this.environmentService = this.container.resolve<EnvironmentService>(
      ContainerTokens.ENVIRONMENT_SERVICE,
    );
    this.config = this.environmentService.getConfig();

    this.webServer = createWeb(this.container, this.config);
  }

  async initialize(): Promise<void> {
    console.log('Application initialization started');

    console.log(
      'Application configuration successfully loaded:',
      JSON.stringify(this.config, undefined, 2),
    );

    registerModulesRoutes(this.container);
  }

  async start(): Promise<void> {
    console.log('Application starting...');

    const host = '::';
    const port = this.config.appPort;
    await this.webServer.listen({ host, port });
  }
}
