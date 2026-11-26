# Startup Modules

A business module supplies DI declarations through [`IModule`](module.types.ts). A startup module implements [`IStartupModule`](startup-module.types.ts) when the application must explicitly initialize, start and stop a resource. Use the [business module example](../../../README.md#-module-setup-example) for request handling and the [engineering guide](../../../AGENTS.md) for resource ownership rules.

## Registering a Startup Module

The composition root in [`index.ts`](../../../index.ts) explicitly registers [`WebServerModule`](../server/modules/web-server.module.ts), the only built-in startup module. [`setupApp`](../app/setup-app.ts) loads the environment, creates the classic-injection container, registers global dependencies and business modules, and returns the application. An application that needs a cron job or worker supplies its own startup module.

This excerpt shows the existing calls inside the async application entry point. The entry point also installs a graceful shutdown handler after startup.

```typescript
const app = await setupApp(globalDIConfigs, modules);
app.registerStartupModule(new WebServerModule());
await app.initialize();
await serviceInitializerPool.initializeAll();
await app.start();
```

## Lifecycle

| Stage in the current entry point | Observable behavior |
| --- | --- |
| Register | The application stores startup modules by name. Registering another instance with the same name replaces the previous one. |
| `app.initialize()` | Calls each startup module's `initialize(container)` in registration order. The HTTP module creates Fastify and binds its routes. After the modules initialize, the application awaits the global `onInitiate` hooks in parallel. |
| `serviceInitializerPool.initializeAll()` | The entry point runs the explicitly registered initializers in sequence. The pool is separate from `Application.initialize()`. |
| `app.start()` | Starts each startup module in order. The HTTP module begins listening here. |
| `app.stop()` | Stops the registered modules in reverse order. A stop error is logged and the application continues with the remaining modules. The HTTP module closes its Fastify instance. |

The [initializer pool](../utils/initializer-pool.ts) exports the shared `serviceInitializerPool` and a `createInitializerPool()` factory. Register callbacks during explicit application setup when work needs to finish between initialization and start. The pool retains its registrations across calls. A rejected initializer propagates to the caller.

### Readiness and cleanup

The [global Prisma registration](../di/global-di-configs.ts) tries to connect during `onInitiate`. The current [hook executor](../di/on-initiate-executor.ts) logs an ordinary rejected hook and allows initialization to finish. An authentication failure thrown by the connection helper can therefore be followed by HTTP startup. A response from the welcome route establishes HTTP availability only.

[Fastify's Awilix registration](../server/bootstrap/web-server.ts) enables disposal on response for request scopes and on close for the supplied container. The current Prisma registration has no resolver disposer wired to its `disconnect()` method. The stock entry point installs its shutdown handler after startup and has no catch path to call `app.stop()` on an earlier startup failure.

The accepted [Prisma design](https://github.com/RougeLi/WebServiceTemplate/issues/35) specifies a readiness check before HTTP start and a single owner for Prisma cleanup. Under that design the singleton resolver's disposer releases the resource, and Fastify close triggers disposal in an HTTP application. The [application lifecycle design](https://github.com/RougeLi/WebServiceTemplate/issues/32) tracks general cleanup for other process types and decisions about repeated or concurrent lifecycle calls.

## Creating a Startup Module

Implement `name`, `initialize(container)`, `start()` and `stop()` for the resource you own. For example, a queue consumer can acquire its client during initialization, begin taking work on start, and drain and release the client on stop. Register the instance in the composition root before `app.initialize()`. The source of [WebServerModule](../server/modules/web-server.module.ts) shows a complete implementation for an HTTP listener.

The current runtime supports one active application per Node process. A fresh container on each `setupApp()` allows dependency declarations to be collected again. Route tokens and the shared initializer pool have process-wide scope. See the [dependency collection contract](../../../README.md#dependency-collection-lifecycle).
