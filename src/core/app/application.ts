import { ContainerTokens } from 'src/core/constants';
import { createWebServer } from 'src/core/server/bootstrap';
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
    console.log('Application initialization started...');

    const { appName, appEnv } = this.config;
    console.log(
      'Application configuration:',
      JSON.stringify({ appName, appEnv }, undefined, 2),
    );

    this.webServer = await createWebServer(this.container, this.config);

    // Register routes
    registerRoutes(this.container, this.webServer);
  }

  async start(): Promise<void> {
    console.log('Application starting...');
    const host = '::';
    const port = this.config.appPort;
    await this.webServer.listen({ host, port });
    console.log(`Application started on ${host}:${port}.`);
  }
}
