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

The [Prisma singleton registration](../di/global-di-configs.ts) marks its initialization hook as `required`. It executes `SELECT 1` through `$queryRaw` before the HTTP module can listen. A temporary connection failure keeps HTTP closed while the service retries. A configuration, authentication, access or TLS error rejects initialization. The [hook executor](../di/on-initiate-executor.ts) waits for all hooks to settle, then propagates the first required failure in the order it occurred. It logs optional hook failures and continues.

[Fastify's Awilix registration](../server/bootstrap/web-server.ts) disposes each request scope on response. The Prisma Client and pool remain available to the next request. On `app.stop()`, the HTTP module closes Fastify. Fastify disposes the root container and the Prisma singleton resolver's `onDispose` calls `disconnect()` once.

If initialization or listen fails, the entry point reports the original error, awaits `app.stop()`, and exits with code 1. Module stop errors are logged separately so the original startup error remains visible. A process without the HTTP module needs its own disposal trigger. A query after disconnect can recreate the pool, and resolving a disposed singleton can create a new client. The [application lifecycle design](https://github.com/RougeLi/WebServiceTemplate/issues/32) tracks general non-HTTP cleanup and repeated or concurrent lifecycle calls.

## Creating a Startup Module

Implement `name`, `initialize(container)`, `start()` and `stop()` for the resource you own. For example, a queue consumer can acquire its client during initialization, begin taking work on start, and drain and release the client on stop. Register the instance in the composition root before `app.initialize()`. The source of [WebServerModule](../server/modules/web-server.module.ts) shows a complete implementation for an HTTP listener.

The current runtime supports one active application per Node process. A fresh container on each `setupApp()` allows dependency declarations to be collected again. Route tokens and the shared initializer pool have process-wide scope. See the [dependency collection contract](../../../README.md#dependency-collection-lifecycle).
