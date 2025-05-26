import { ContainerTokens } from 'src/core/constants';
import { EnvironmentService } from 'src/core/services';
import {
  AppConfigType,
  AppContainer,
  IStartupModule,
  WebServer,
} from 'src/core/types';
import { createWebServer } from '../bootstrap';
import { registerRoutes } from '../handlers';

/**
 * WebServerModule is responsible for initializing and starting the web server.
 * It implements the IStartupModule interface, allowing it to be registered with
 * the application and managed as part of the application lifecycle.
 */
export class WebServerModule implements IStartupModule {
  readonly name = 'WebServer';
  private webServer!: WebServer;
  private config!: AppConfigType;

  /**
   * Initialize the web server module. This method creates the web server instance
   * and registers all routes but does not start listening for requests.
   *
   * @param container The DI container used to resolve dependencies.
   */
  async initialize(container: AppContainer): Promise<void> {
    console.log('WebServerModule initialization started...');

    // Resolve environment service and get config
    const environment = container.resolve<EnvironmentService>(
      ContainerTokens.ENVIRONMENT,
    );
    this.config = environment.getConfig();

    // Create web server
    this.webServer = await createWebServer(container, this.config);

    // Register routes
    registerRoutes(container, this.webServer);

    console.log('WebServerModule initialization completed.');
  }

  /**
   * Start the web server. This method starts the web server listening for requests.
   */
  async start(): Promise<void> {
    console.log('WebServerModule starting...');
    const host = '::';
    const port = this.config.appPort;
    await this.webServer.listen({ host, port });
    console.log(`WebServerModule started and listening on port ${port}`);
  }

  /**
   * Stop the web server. This method gracefully closes the web server.
   */
  async stop(): Promise<void> {
    console.log('WebServerModule stopping...');
    if (this.webServer) {
      await this.webServer.close();
      console.log('WebServerModule stopped.');
    }
  }
}
