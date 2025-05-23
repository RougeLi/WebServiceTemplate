import { IStartupModule } from 'src/core/types';

export interface IApplication {
  /**
   * Register a startup module with the application.
   * @param module The startup module is to register.
   */
  registerStartupModule(module: IStartupModule): void;

  /**
   * Initialize the application and all registered startup modules.
   */
  initialize: () => Promise<void>;

  /**
   * Start the application and all registered startup modules.
   */
  start: () => Promise<void>;

  /**
   * Stop the application and all registered startup modules.
   */
  stop: () => Promise<void>;
}
