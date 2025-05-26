import { DI } from 'src/core';
import {
  AppContainer,
  GlobalContainerConfigEntries,
  IStartupModule,
} from 'src/core/types';
import { IApplication } from './app.types';

export default class Application implements IApplication {
  private startupModules: Map<string, IStartupModule> = new Map();

  constructor(
    private readonly container: AppContainer,
    private readonly globalContainerConfigEntries: GlobalContainerConfigEntries,
  ) {}

  /**
   * Register a startup module with the application.
   * @param module The startup module is to register.
   */
  registerStartupModule(module: IStartupModule): void {
    // Check if a module with the same name is already registered
    if (this.startupModules.has(module.name)) {
      console.log(
        `Module with name "${module.name}" is already registered. Replacing.`,
      );
    }

    // Add or replace the module in the map
    this.startupModules.set(module.name, module);
  }

  /**
   * Initialize the application and all registered startup modules.
   */
  async initialize(): Promise<void> {
    console.log('Application initialization started...');

    // Initialize all startup modules
    for (const module of this.startupModules.values()) {
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
    for (const module of this.startupModules.values()) {
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
    for (const module of [...this.startupModules.values()].reverse()) {
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
