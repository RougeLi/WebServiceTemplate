/**
 * Initializer Pool
 *
 * A utility for registering and executing initialization functions.
 * This follows the Plugin pattern / Initialization Registry pattern.
 */

type InitializerFunction = () => Promise<void>;

/** Interface for the initializer pool */
export interface InitializerPool {
  register: (fn: InitializerFunction) => void;
  initializeAll: () => Promise<void>;
}

/** Creates an initializer pool that can register and execute initialization functions. */
export function createInitializerPool(): InitializerPool {
  const initializers: InitializerFunction[] = [];

  /**
   * Register an initialization function to be executed later.
   * @param fn The initialization function to register
   */
  function register(fn: InitializerFunction): void {
    initializers.push(fn);
  }

  /** Execute all registered initialization functions in sequence. */
  async function initializeAll(): Promise<void> {
    for (const initializer of initializers) {
      await initializer();
    }
  }

  return {
    register,
    initializeAll,
  };
}

/** Singleton instance of the initializer pool that can be used across the application */
export const serviceInitializerPool = createInitializerPool();

export default createInitializerPool;
