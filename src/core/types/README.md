# Startup Modules

This directory contains the `IStartupModule` interface, which is used to define startup modules for the application.
Startup modules are responsible for initializing and starting specific parts of the application, such as a web server,
cron jobs, or message queue consumers.

## IStartupModule Interface

The `IStartupModule` interface defines the lifecycle methods for a startup module:

```typescript
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
   * initialized, and is responsible for starting the actual service.
   */
  start(): Promise<void>;

  /**
   * Stop the startup module. This method is called when the application is shutting
   * down, and is responsible for gracefully stopping the service.
   */
  stop(): Promise<void>;
}
```

## Creating a Startup Module

To create a new startup module, implement the `IStartupModule` interface:

```typescript
import { AppContainer, IStartupModule } from 'src/core/types';

export class MyStartupModule implements IStartupModule {
  readonly name = 'MyModule';

  async initialize(container: AppContainer): Promise<void> {
    console.log('MyStartupModule initialization started...');
    // Initialize your module here
    console.log('MyStartupModule initialization completed.');
  }

  async start(): Promise<void> {
    console.log('MyStartupModule starting...');
    // Start your module here
    console.log('MyStartupModule started.');
  }

  async stop(): Promise<void> {
    console.log('MyStartupModule stopping...');
    // Stop your module here
    console.log('MyStartupModule stopped.');
  }
}
```

## Registering a Startup Module

To register a startup module with the application, use the `registerStartupModule` method of the `Application` class:

```typescript
import { setupApp } from 'src/core/app';
import { globalDIConfigs } from 'src/core/di';
import modules from 'src/modules';
import { MyStartupModule } from './my-startup-module';

(async () => {
  const app = await setupApp(globalDIConfigs, modules);

  // Register your startup module
  app.registerStartupModule(new MyStartupModule());

  await app.initialize();
  await app.start();
})();
```

## Built-in Startup Modules

The application comes with the following built-in startup modules:

### WebServerModule

The `WebServerModule` is responsible for initializing and starting the web server. It is registered by default in the
`setupApp` function.

### CronJobModule

The `CronJobModule` is an example of a startup module that manages cron jobs. It is not registered by default, but can
be registered as shown in the example above.

## Lifecycle

The application manages the lifecycle of all registered startup modules:

1. During `app.initialize()`, the `initialize` method of each startup module is called.
2. During `app.start()`, the `start` method of each startup module is called.
3. During `app.stop()`, the `stop` method of each startup module is called in reverse order.

This ensures that all modules are properly initialized, started, and stopped in the correct order.
