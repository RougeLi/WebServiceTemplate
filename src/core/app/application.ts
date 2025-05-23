import { DI } from 'src/core';
import { ContainerTokens } from 'src/core/constants';
import { EnvironmentService } from 'src/core/services';
import {
  AppConfigType,
  AppContainer,
  GlobalContainerConfigEntries,
  IStartupModule,
} from 'src/core/types';
import { IApplication } from './app.types';

export default class Application implements IApplication {
  private environment: EnvironmentService;
  private readonly config: AppConfigType;
  private startupModules: IStartupModule[] = [];

  constructor(
    private readonly container: AppContainer,
    private readonly globalContainerConfigEntries: GlobalContainerConfigEntries,
  ) {
    this.environment = this.container.resolve<EnvironmentService>(
      ContainerTokens.ENVIRONMENT,
    );
    this.config = this.environment.getConfig();
  }

  /**
   * Register a startup module with the application.
   * @param module The startup module is to register.
   */
  registerStartupModule(module: IStartupModule): void {
    console.log(`Registering startup module: ${module.name}`);
    this.startupModules.push(module);
  }

  /**
   * Initialize the application and all registered startup modules.
   */
  async initialize(): Promise<void> {
    console.log('Application initialization started...');

    const { appName, appEnv } = this.config;
    console.log(
      'Application configuration:',
      JSON.stringify({ appName, appEnv }, undefined, 2),
    );

    // Initialize all startup modules
    for (const module of this.startupModules) {
      console.log(`Initializing module: ${module.name}`);
      await module.initialize(this.container);
    }

    // Execute onInitiate hooks for global services
    await DI.executeOnInitiateHooks(
      this.container,
      this.globalContainerConfigEntries,
    );

    console.log('Application initialization completed.');
  }

  /**
   * Start the application and all registered startup modules.
   */
  async start(): Promise<void> {
    console.log('Application starting...');

    // Start all startup modules
    for (const module of this.startupModules) {
      console.log(`Starting module: ${module.name}`);
      await module.start();
    }

    console.log('Application started successfully.');
  }

  /**
   * Stop the application and all registered startup modules.
   */
  async stop(): Promise<void> {
    console.log('Application stopping...');

    // Stop all startup modules in reverse order
    for (const module of [...this.startupModules].reverse()) {
      console.log(`Stopping module: ${module.name}`);
      try {
        await module.stop();
      } catch (error) {
        console.error(`Error stopping module ${module.name}:`, error);
      }
    }

    console.log('Application stopped.');
  }
}
