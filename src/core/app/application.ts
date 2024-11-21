import { ContainerTokens } from 'src/core/constants';
import { createWeb } from 'src/core/server/bootstrap';
import { registerRoutes } from 'src/core/server/handlers';
import { EnvironmentService } from 'src/core/services';
import { AppConfigType, AppContainer, WebServer } from 'src/core/types';
import { IApplication } from './app.types';

export default class Application implements IApplication {
  private environmentService: EnvironmentService;
  private readonly config: AppConfigType;
  private webServer!: WebServer;

  constructor(private readonly container: AppContainer) {
    this.environmentService = this.container.resolve<EnvironmentService>(
      ContainerTokens.ENVIRONMENT_SERVICE,
    );
    this.config = this.environmentService.getConfig();
  }

  async initialize(): Promise<void> {
    console.log('Application initialization started');
    console.log(
      'Application configuration successfully loaded:',
      JSON.stringify(this.config, undefined, 2),
    );
    this.webServer = await createWeb(this.container, this.config);
    registerRoutes(this.container, this.webServer);
  }

  async start(): Promise<void> {
    console.log('Application starting...');
    const host = '::';
    const port = this.config.appPort;
    await this.webServer.listen({ host, port });
  }
}
