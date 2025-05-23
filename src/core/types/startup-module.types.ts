import { AppContainer } from './di.types';

/**
 * Interface for startup modules that can be registered with the application.
 * Each startup module is responsible for initializing and starting a specific
 * part of the application, such as a web server, cron jobs, or message queue consumers.
 */
export interface IStartupModule {
  /**
   * Name of the startup module, used for logging and identification.
   */
  readonly name: string;

  /**
   * Initialize the startup module. This method is called during the application
   * initialization phase, before any module is started.
   *
   * @param container The DI container that can be used to resolve dependencies.
   */
  initialize(container: AppContainer): Promise<void>;

  /**
   * Start the startup module. This method is called after all modules have been
   * initialized and is responsible for starting the actual service.
   */
  start(): Promise<void>;

  /**
   * Stop the startup module. This method is called when the application is shut
   *  down and is responsible for gracefully stopping the service.
   */
  stop(): Promise<void>;
}
