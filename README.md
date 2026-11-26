# Web Service Template

[![Node.js](https://img.shields.io/badge/Node.js-Latest-339933?style=flat&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.x-000000?style=flat&logo=fastify)](https://www.fastify.io/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10.1-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PNPM](https://img.shields.io/badge/PNPM-Latest-F69220?style=flat&logo=pnpm)](https://pnpm.io)

A foundational template for efficiently developing scalable web service applications.

## 📋 Table of Contents

- [📝 Project Introduction](#-project-introduction)
- [🚀 Quick Start](#-quick-start)
- [📂 Project Structure](#-project-structure)
- [🏗 System Architecture](#-system-architecture)
- [💻 Development Guide](#-development-guide)
- [🗄 Database (Prisma 7)](#-database-prisma-7)
- [⚙️ Environment Variables](#-environment-variables)
- [📦 Deployment](#-deployment)
- [🔧 Module Setup Example](#-module-setup-example)
- [❓ FAQ](#-faq)

---

## 📝 Project Introduction

Web Service Template is a backend service template developed based on the Fastify framework, providing developers with
an efficient and scalable foundation for web service development.

### Key Features

- **Efficient Development:** Provides a foundational template for developing scalable web services
- **Modular Design:** Separates core functionalities from business modules for easy maintenance and scalability
- **Simplified Workflow:** Offers rich script commands to simplify development, testing, and deployment
- **Enhanced Development Efficiency:** Supports hot reloading and automatic compilation
- **Integrated Core Functionalities:** Includes built-in dependency injection, configuration management, error handling,
  and more

---

## 🚀 Quick Start

### Prerequisites

- Ensure you have the correct version of Node.js installed (see `.nvmrc` for details)
- Install [pnpm](https://pnpm.io/) globally:

  ```bash
  npm install -g pnpm
  ```

### Installation Steps

1. **Clone the repository and navigate to the project directory**

   ```bash
   git clone <repository_url>
   cd <project_directory>
   ```

2. **Deploy the local development environment**  
   (See the [Development Guide](#-development-guide) section for details)

3. **Copy the example environment variables file**

   ```bash
   cp .env.example .env
   ```

4. **Install dependencies**

   ```bash
   nvm use  # (Optional: switch to the Node.js version specified in .nvmrc)
   pnpm run install:ci
   ```

5. **Compile TypeScript files**

   `build` generates the Prisma Client first and then compiles; no database is
   needed.

   ```bash
   pnpm run build
   ```

6. **Start the development server**

   `start` also runs `prisma:generate` before the watchers. The server needs a
   reachable PostgreSQL database (see
   [Setting Up a Local PostgreSQL Database](#setting-up-a-local-postgresql-database)).

   ```bash
   pnpm start
   ```

---

## 📂 Project Structure

This project follows a clear separation between core components and business modules:

```
├── README.md
├── index.ts                # Application entry point
├── package.json
├── prisma.config.ts        # Prisma CLI configuration (schema, migrations, seed, datasource URL)
├── prisma/
│   ├── schema.prisma       # Prisma schema (generator + models)
│   ├── migrations/         # Migration history (never rewritten)
│   └── seed.ts             # Seed entry point (`pnpm run prisma:seed`)
├── tsconfig.json
├── tsconfig.eslint.json
├── eslint.config.mjs
├── jest.config.js
├── pnpm-lock.yaml
├── node_modules/
├── src/
│   ├── core/               # Framework core: app initialization, DI, server, config, etc.
│   │   ├── app/            # Application setup and initialization
│   │   ├── config/         # Environment and configuration management
│   │   ├── constants/      # Application-wide constants and enums
│   │   ├── di/             # Dependency injection setup
│   │   │   ├── di-container.ts
│   │   │   ├── global-di-configs.ts  # Global DI configurations (e.g., Logger, Environment, Prisma, etc.)
│   │   │   ├── on-initiate-executor.ts
│   │   │   └── index.ts
│   │   ├── server/         # Web server configuration, routing, and error handling
│   │   │   ├── bootstrap/  # Server initialization
│   │   │   ├── modules/    # Startup modules (e.g., WebServerModule)
│   │   │   └── ...
│   │   ├── services/       # Core services (e.g., Logger, Environment)
│   │   ├── types/          # Type definitions and interfaces
│   │   │   ├── startup-module.types.ts  # IStartupModule interface
│   │   │   └── ...
│   │   ├── utils/          # Utility functions and base module classes
│   │   └── index.ts
│   ├── generated/prisma/   # Generated Prisma Client (`prisma generate`, not committed)
│   ├── modules/            # Business modules (each module can be later extracted as an independent package)
│   │   ├── hello/          # Example Hello module
│   │   │   ├── constants/
│   │   │   ├── controllers/
│   │   │   ├── dto/
│   │   │   ├── model/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── spec/
│   │   │   ├── types/
│   │   │   ├── hello.module.ts  # Module configuration & DI registration
│   │   │   └── index.ts         # Module exports
│   │   └── index.ts        # Aggregated module registration
│   └── index.ts            # (Optional) Additional entry point for src directory if needed
├── test-utils/             # Testing utilities and mocks
│   ├── containers/
│   └── mocks/
```

### Core Module (`core`)

The `core` directory contains the essential framework parts:

- **`app/`**: Application initialization and server setup
- **`config/`**: Environment loading and configuration management
- **`constants/`**: Definitions for tokens, modes, and other constants
- **`di/`**: Dependency injection container, including global DI configurations in `global-di-configs.ts`
- **`server/`**: Fastify server setup, routing, error handling, and Swagger documentation
- **`services/`**: Core services like Logger, Environment, etc.
- **`types/`**: Shared TypeScript types and interfaces
- **`utils/`**: Base classes and helper functions for modules, including the initializer-pool mechanism

### Modular Startup Process

The application uses a modular startup process that allows different types of services (web server, cron jobs, message
queue consumers, etc.) to be initialized, started, and stopped in a coordinated way. This is implemented through the
`IStartupModule` interface:

```typescript
export interface IStartupModule {
  readonly name: string;

  initialize(container: AppContainer): Promise<void>;

  start(): Promise<void>;

  stop(): Promise<void>;
}
```

#### Built-in Startup Modules

- **WebServerModule**: Initializes and starts the Fastify web server. This module is registered by default.

#### Registering a Startup Module

To register a startup module:

```typescript
import { setupApp } from 'src/core/app';
import { CronJobModule } from 'src/core';
import { globalDIConfigs } from 'src/core/di';
import { WebServerModule } from 'src/core/server';
import modules from 'src/modules';

(async () => {
  const app = await setupApp(globalDIConfigs, modules);

  // Register a default startup module
  app.registerStartupModule(new WebServerModule());

  await app.initialize();
  await app.start();
})();
```

For more details, see the [Startup Modules documentation](src/core/types/README.md).

### Initializer Pool Mechanism

The application includes an Initializer Pool utility that follows the Plugin pattern / Initialization Registry pattern. This mechanism allows for registering and executing initialization functions in a coordinated way.

```typescript
// Example of using the initializer pool
import { serviceInitializerPool } from 'src/core/utils/initializer-pool';

// Register an initialization function
serviceInitializerPool.register(async () => {
  // Initialization logic here
  console.log('Initializing service...');
});

// Execute all registered initialization functions
await serviceInitializerPool.initializeAll();
```

Key features of the Initializer Pool:
- **Registration**: Register initialization functions to be executed later
- **Sequential Execution**: Execute all registered functions in sequence
- **Singleton Instance**: A singleton instance (`serviceInitializerPool`) is available for application-wide use
- **Custom Pools**: Create custom initializer pools using the `createInitializerPool()` function

This mechanism is particularly useful for initializing services, setting up event listeners, or performing any other startup tasks that need to be coordinated across different parts of the application.

### Business Modules

All business or feature modules are organized under `src/modules`. Each module is self-contained and registers its own
dependencies. This design improves clarity and allows modules to be later extracted as independent packages.

---

## 🏗 System Architecture

Web Service Template adopts a modular architecture that separates core framework functionalities from business logic.

### Architecture Layers

1. **Core Layer**
    - Provides infrastructure: dependency injection, configuration management, server setup
    - Handles cross-cutting concerns: logging, error handling, request context

2. **Module Layer**
    - Contains independent business feature modules
    - Each module is self-contained and can be developed independently

3. **Service Layer**
    - Implements business logic
    - Handles data transformation and business rules

4. **Controller Layer**
    - Processes HTTP requests and responses
    - Validates input and formats output

5. **Route Layer**
    - Defines API endpoints
    - Connects HTTP requests to controllers

---

## 💻 Development Guide

### Available Script Commands

- **install:ci**: Install dependencies with a frozen lockfile (ideal for CI)
  ```bash
  pnpm run install:ci
  ```

- **install:dev**: Install dependencies without freezing the lockfile (for development)
  ```bash
  pnpm run install:dev
  ```

- **build**: Compile TypeScript files
  ```bash
  pnpm run build
  ```

- **start**: Run the development server with automatic recompilation
  ```bash
  pnpm start
  ```

- **lint**: Check code quality via linting
  ```bash
  pnpm run lint
  ```

- **lint:fix**: Automatically fix linting issues
  ```bash
  pnpm run lint:fix
  ```

- **unittest:coverage**: Run unit tests and generate a coverage report
  ```bash
  pnpm run unittest:coverage
  ```

- **prisma:generate**: Generate the Prisma Client into `src/generated/prisma`
  (no database needed)
  ```bash
  pnpm run prisma:generate
  ```

- **prisma:migrate** / **prisma:deploy** / **prisma:reset**: `prisma migrate dev`,
  `prisma migrate deploy` and `prisma migrate reset` (need `DATABASE_URL`)

- **prisma:seed**: Run `prisma db seed` (needs `DATABASE_URL`)

### Development Workflow

1. **Live Reloading**  
   During development, changes are automatically compiled and the server is restarted:
   ```bash
   pnpm start
   ```

2. **Code Quality**  
   Ensures consistent code formatting and style:
   ```bash
   pnpm run lint:fix
   ```

3. **Testing**  
   Run unit tests and generate coverage reports:
   ```bash
   pnpm run unittest:coverage
   ```

### Setting Up a Local PostgreSQL Database

1. **Install [Docker](https://www.docker.com/)**

2. **Navigate to the project's `.dev-app-projects` directory**
   ```bash
   cd .dev-app-projects
   ```

3. **Start the Docker containers**
   ```bash
   docker-compose up -d
   ```

4. **Prepare the database**  
   Set `DATABASE_URL` in `.env`, then run the steps explicitly. Prisma 7's
   `migrate dev` does not generate the Client or run the seed for you:
   ```bash
   pnpm run prisma:migrate    # create/apply migrations
   pnpm run prisma:generate   # regenerate the Client
   pnpm run prisma:seed       # optional; the template has no seed data
   ```
   See [Database (Prisma 7)](#-database-prisma-7) for details.

---

## 🗄 Database (Prisma 7)

### Versions and upgrades

`prisma` (devDependency), `@prisma/client` and `@prisma/adapter-pg`
(dependencies) are pinned to the same exact version, **7.10.1**. Upgrade the
three packages together, by hand: read the Prisma release notes, check the
Node.js engine, TypeScript and pnpm requirements, then rerun

```bash
pnpm run install:ci && pnpm run prisma:generate && pnpm run type:check \
  && pnpm run type:check:spec && pnpm run lint && pnpm run unittest \
  && pnpm run build
```

plus a check against a disposable PostgreSQL database (migrations, seed,
queries, application start and stop).
`pnpm-workspace.yaml` lists them under `updateConfig.ignoreDependencies`, so
`pnpm run update:dependencies` (`pnpm update --latest`) leaves them alone;
without it, `prisma` would move to the `latest` dist-tag (an 8.x release
candidate at the time of writing) while the other two stay on 7.x.

The pg pool is created by `@prisma/adapter-pg`; the project does not import
`pg` directly and does not declare `pg` / `@types/pg`. If code ever needs
`pg` directly, add it as a runtime dependency (and `@types/pg` as a
devDependency) instead of relying on the transitive copy.

### CLI configuration vs. runtime configuration

| | Prisma CLI | Application runtime |
| --- | --- | --- |
| Entry | `prisma.config.ts` (repository root) | `src/core/services/prisma.config.ts` + `prisma.service.ts` |
| Loads `.env` | `dotenv/config` (variables already in the environment win) | `loadEnvironment()` in `setupApp` |
| Database URL | `process.env.DATABASE_URL`, trimmed; `datasource` is omitted when empty | `DATABASE_URL`, validated before the adapter is created |
| Used for | `generate`, `migrate *`, `db seed` | Shared `PrismaService` (`ContainerTokens.PRISMA`) |

The application never imports `prisma.config.ts`, and the CLI config never
loads the application, DI or logger. Without `DATABASE_URL`,
`prisma generate` still works; `migrate dev`, `migrate deploy`,
`migrate status` and `migrate reset` stop with
`The datasource.url property is required in your Prisma config file` and exit 1.
`prisma db seed` does not check the URL itself, so `prisma/seed.ts` validates
`DATABASE_URL` first and exits non-zero without printing
`Seeding completed.` when it is missing or invalid.

### Explicit operation order

Prisma 7 does not chain these steps for you, and nothing runs migrations or
seeds during `generate`, `build` or a normal application start.

```bash
# Local development, after editing prisma/schema.prisma
pnpm run prisma:migrate    # prisma migrate dev: create and apply a migration
pnpm run prisma:generate   # regenerate src/generated/prisma
pnpm run prisma:seed       # optional

# Deployment
pnpm run prisma:deploy     # prisma migrate deploy (needs the Prisma CLI, i.e. a full install)
NODE_PATH=./build node build/index.js

# Resetting a disposable development database (never production)
pnpm run prisma:reset      # prisma migrate reset
pnpm run prisma:generate
pnpm run prisma:seed
```

Migrations and seeds must target a database you chose explicitly; there is no
fallback to a local default database.

### Seed

`prisma.config.ts` runs `ts-node prisma/seed.ts` as the seed command. The seed
currently only validates `DATABASE_URL`; the template ships no seed data. If a
seed needs the Client:

1. run `pnpm run prisma:generate` first;
2. import it with a relative path, `import { PrismaClient } from '../src/generated/prisma/client'`
   (the `src/*` alias would require `NODE_PATH=.` in the seed command);
3. create the Client with a `PrismaPg` adapter and call `$disconnect()` in a
   `finally` block, returning a non-zero exit code on failure. The seed's
   Client is independent of the application's shared instance.

### Generated Client and imports

`prisma/schema.prisma` uses the `prisma-client` generator with
`moduleFormat = "cjs"`, so the project stays CommonJS with NodeNext module
resolution. The Client is generated as TypeScript into
`src/generated/prisma/` (ignored by Git, Prettier, ESLint and coverage) and
compiled with the rest of `src/` by `pnpm run build`.

| Context | Import | Resolves to |
| --- | --- | --- |
| Source type-check (`tsc`) and Jest | `src/generated/prisma/client` | `src/generated/prisma/client.ts` |
| `ts-node` scripts and the seed | `../src/generated/prisma/client` (relative), or the alias with `NODE_PATH=.` | `src/generated/prisma/client.ts` |
| Compiled (`NODE_PATH=./build`) | `src/generated/prisma/client` | `build/src/generated/prisma/client.js` |

`ts-node` does not apply the `tsconfig.json` `paths` at run time, so a bare
`src/...` import fails there unless `NODE_PATH=.` is set.

Regenerate after every schema change (`pnpm run prisma:generate`). `pnpm start`
runs `prisma:generate` before starting the TypeScript and nodemon watchers, but
the watchers do not regenerate the Client when `prisma/schema.prisma` changes.

The compiled build runs with production dependencies only
(`pnpm install --prod --frozen-lockfile` plus `build/`): the Prisma CLI,
`ts-node` and `src/` are not needed at runtime.

### Runtime connection

`PrismaService` still extends the generated `PrismaClient` and is registered as
a singleton under `ContainerTokens.PRISMA`. When it is resolved,
`PrismaConfig.getDatabaseConnectionOptions()` validates `DATABASE_URL` and
builds a `PrismaPg` adapter:

- `DATABASE_URL` must be non-empty after trimming, parse as a URL, use the
  `postgresql:` or `postgres:` scheme and include a host (or a `host` query
  parameter), and any `sslrootcert`, `sslcert` or `sslkey` must point to a
  readable file. Otherwise a `DatabaseConfigurationError` is thrown whose
  message never contains the URL or the path. pg itself would silently fall
  back to `localhost:5432` for an empty URL, and would parse a value such as
  `not-a-url` relative to a dummy URL and connect to an unintended host.
- A Unix-socket URL with credentials needs a placeholder host, for example
  `postgresql://<user>:<password>@localhost/<database>?host=/var/run/postgresql`;
  the form with an empty host (`@/`) is not a valid URL.
- Validation happens on resolve, not on import, registration or
  `EnvironmentService` construction, so unit tests and builds do not need
  `DATABASE_URL`.
- Creating the Client opens no connection; the pool connects on the first
  query.

| Setting | Prisma 6 | Prisma 7 + `PrismaPg` (this template) |
| --- | --- | --- |
| Pool size | CPU count × 2 + 1, `connection_limit` URL parameter | `DATABASE_POOL_MAX`, default `10` |
| Connect / pool wait timeout | `connect_timeout` (5 s) and `pool_timeout` (10 s) | `DATABASE_CONNECTION_TIMEOUT_MS`, default `10000`, covers both |
| Timeout error | `P2024` | Plain `Error`: `Connection terminated due to connection timeout` or `timeout exceeded when trying to connect` |
| Idle connections | engine default | pg default, closed after 10 s idle |
| `?schema=` | applied by the engine to every query (`SET search_path`) | parsed by the template and passed as `PrismaPg`'s `schema` option: model queries only; raw SQL keeps the connection `search_path` |
| TLS without SSL parameters | `sslmode=prefer` (TLS when the server offers it) | no TLS unless an SSL setting such as `sslmode`, `ssl`, a certificate parameter or `PGSSLMODE` is present |
| Interactive transactions | `maxWait` 2000 ms, `timeout` 5000 ms | unchanged (`P2028` when exceeded) |

pg's own connection timeout default is `0` (wait forever), which would block
both the retry loop and shutdown on an unroutable host; the template therefore
always sets a finite timeout.

Prisma 6-only URL parameters (`connection_limit`, `pool_timeout`,
`connect_timeout`, `socket_timeout`, `pgbouncer`, `statement_cache_size`,
`channel_binding`, `sslaccept`, `sslidentity`, `sslpassword`) are not applied
by pg. When present, `PrismaService` logs a warning that lists only their
names. Parameters pg understands (for example `sslmode`, `sslrootcert`,
`application_name`, `options`) are applied.

`?schema=` is honoured by the CLI and by model queries, so migrations and the
Client's model API target the same PostgreSQL schema. Raw SQL (`$queryRaw`,
`$executeRaw`) is different from Prisma 6: it runs with the connection's
`search_path`, so unqualified table names resolve in `public` (or the role's
default). When `?schema=` is set, `PrismaService` logs a warning unless the
URL's `options` parameter sets a search path that starts with that schema.
Either schema-qualify raw SQL
or, when connecting directly to PostgreSQL, add
`options=-c%20search_path%3D<schema>` to `DATABASE_URL`. The template does not
add that startup parameter itself because connection poolers such as PgBouncer
reject unknown startup parameters by default.

`sslmode` is applied by pg: `sslmode=require` against a server without TLS
fails with `TlsConnectionError`. pg currently treats `prefer`, `require` and
`verify-ca` as `verify-full` and prints a security warning that pg 9 will
switch to libpq semantics; use `sslmode=verify-full` to keep today's behaviour
explicitly. Without any SSL setting (for example `sslmode`, `ssl`,
`sslnegotiation=direct`, a certificate parameter or the `PGSSLMODE`
environment variable) pg does not use TLS, whereas Prisma 6 defaulted to
`prefer`; set `sslmode` (with `sslrootcert` for a private CA) when the server
requires TLS. A certificate parameter without `sslmode` turns on TLS with
certificate verification, while `sslmode=disable` still disables TLS and
`sslmode=no-verify` disables verification. Certificate parameters also
changed meaning:
Prisma 6's `sslcert` was the server (CA) certificate, while pg reads `sslcert`
as the client certificate and `sslrootcert` as the CA, and pg resolves the
paths relative to the working directory instead of `./prisma`. Never disable
certificate verification globally to make a connection work.

### Readiness, retries and errors

`connect()` (run by the Prisma `onInitiate` hook) calls `$connect()` and then
`SELECT 1` through `$queryRaw`. With driver adapters `$connect()` does not open
a connection, so only a successful query counts as ready, and
`Database connection established.` is logged only after it. Failures are
classified by `error.meta.driverAdapterError.cause.kind`, not by Prisma error
codes or message text (`$queryRaw` reports connection failures as `P2010`;
model queries as `P1000`, `P1001`, `P1003`).

| Classification | Errors |
| --- | --- |
| Fail fast (no retry) | `AuthenticationFailed`, `DatabaseDoesNotExist`, `DatabaseAccessDenied`, `TlsConnectionError`, `DatabaseConfigurationError`, a revoked `CONNECT` privilege (kind `postgres`, SQLSTATE `42501`), a missing password (pg: `client password must be a string`) |
| Retry | `DatabaseNotReachable`, `SocketTimeout`, `ConnectionClosed`, `TooManyConnections`, errors without a `kind` (such as the pg connection timeout), and any other `kind` |

Retries keep the previous semantics: unlimited attempts, waiting
`1000 ms × attempt` plus 0–500 ms jitter, capped at 30 s, with each attempt
bounded by `DATABASE_CONNECTION_TIMEOUT_MS`. Log messages contain the
classification and the driver message (host, port or user name), never the
connection string or password.

### Startup and shutdown

| Situation | Behaviour |
| --- | --- |
| Import, `prisma generate`, `build` | No database connection |
| Normal `initialize()` | Startup modules initialize, then the global `onInitiate` hooks run; the Prisma hook succeeds only after `SELECT 1`, and only then does `start()` begin accepting HTTP requests |
| Fail-fast error (missing/invalid `DATABASE_URL`, bad credentials, missing database, access denied, TLS or certificate error) | `initialize()` rejects, HTTP never starts, `index.ts` cleans up and exits with code 1 |
| Database temporarily unavailable | The Prisma hook keeps retrying with backoff; HTTP starts once the database answers |
| `app.stop()` / Fastify close (also on SIGINT/SIGTERM through `close-with-grace`) | The container is disposed and the Prisma Client and its pool are released once |
| A request completes | The request scope is disposed; the application singleton stays open |
| `initialize()` or `start()` fails | `index.ts` logs the original error, calls `app.stop()` to release what was created, logs any cleanup error separately, and exits with code 1 |

Two opt-in fields of `GlobalContainerConfig` implement this:

- `required: true` makes an `onInitiate` failure reject `Application.initialize()`.
  All hooks still run concurrently, the rejection happens only after every
  hook has settled, and if several required hooks fail the first original
  error (in the order the failures occur) is rethrown. Hooks without the flag
  keep the previous contract: the failure is logged and initialization
  continues. Only the Prisma hook is marked required.
- `onDispose(instance)` becomes the registration's Awilix `.disposer()`.
  `container.dispose()` (Fastify close with `disposeOnClose`) calls it for
  singleton or scoped instances that were resolved; request-scope disposal does
  not touch root singletons, and an instance that was never resolved is never
  created or disposed. The Prisma registration's disposer calls
  `PrismaService.disconnect()` and is the only owner of the shared Client and
  pool; `Application.stop()` does not dispose the container itself.

Known limitations (general application lifecycle work is tracked in [#32](https://github.com/RougeLi/WebServiceTemplate/issues/32)):

- An application without `WebServerModule` has no trigger that disposes the
  container, so the Prisma pool is not released by `app.stop()`.
- A query after `$disconnect()` silently creates a new pool, and resolving
  `ContainerTokens.PRISMA` after the container was disposed creates a new
  Client.
- One process runs one active application; restarting an application in the
  same process is not supported.

### Connection ownership

- Each application has one shared Client and pool (`ContainerTokens.PRISMA`,
  singleton). Request scopes resolve the same instance; nothing is created per
  request.
- The registration's disposer releases the Client and pool when the
  container is disposed. `$disconnect()` closes the adapter's pool, and calling
  it twice is safe.
- CLI commands, seeds and scripts create their own Client and must
  `$disconnect()` it in `finally`; they never take over the application's
  instance.
- Tests can register a fake under `ContainerTokens.PRISMA` in an isolated
  container; no database is needed.

### Query logging

Logging options are unchanged: query events in development or with
`FORCE_PRISMA_QUERY_LOG=true` (`debug` normally, `info` when forced), `info` /
`warn` / `error` events routed to the matching logger level, parameter
formatting with `PRISMA_QUERY_ENABLE_JSON_PARSE`, `PRISMA_QUERY_DELIMITER` and
truncation, and `errorFormat` (`pretty` in development, `minimal` elsewhere).
With Prisma 7.10.1 and `PrismaPg`:

- `query` events keep `timestamp`, `query`, `params` (JSON string), `duration`
  and `target` (`ClientEngine`). `duration` is now fractional; the formatter
  rounds it to whole milliseconds as before.
- Transaction control statements (`BEGIN`, `COMMIT`, `ROLLBACK`) appear as
  query events.
- `error` events are emitted for failed queries. No `info` or `warn` events
  were observed; the subscriptions are kept.

### Consumer migration notes (Prisma 6 → 7)

- Import the Client, the `Prisma` namespace, model types and error classes
  (`Prisma.PrismaClientKnownRequestError`, ...) from
  `src/generated/prisma/client` instead of `@prisma/client` or `.prisma/client`.
  There is no compatibility shim for the old location.
- `PrismaService`, `ContainerTokens.PRISMA`, `ContainerTokens.PRISMA_CONFIG`
  and `IDBService.connect/disconnect` keep their names and injection. New:
  `PrismaConfig.getDatabaseConnectionOptions()`, `databasePoolMax` and
  `databaseConnectionTimeoutMs`. `CustomPrismaClient` now includes `$queryRaw`
  (used for readiness); hand-written fakes typed with it need that member.
- The Prisma Client constructor returns its own object, so
  `instanceof PrismaService` / `instanceof PrismaClient` is `false`, as it
  already was with Prisma 6.
- Replace Prisma 6 URL parameters with `DATABASE_POOL_MAX` and
  `DATABASE_CONNECTION_TIMEOUT_MS`, and handle the plain timeout `Error`
  instead of `P2024`.
- Review TLS settings: add `sslmode` where Prisma 6's default `prefer` was
  relied on, replace Prisma 6 `sslcert=<CA>` with `sslrootcert=<CA>`, and use
  paths relative to the working directory.
- With `?schema=`, schema-qualify raw SQL or set `search_path` through the
  URL's `options` parameter; Prisma 7 applies `schema` to model queries only.
- `package.json#prisma` was removed; the seed command lives in
  `prisma.config.ts`. `build` now generates before compiling, `start`
  generates first, and `prisma:seed` was added.
- `model log` is mapped to the existing `"Log"` table with `@@map("Log")`;
  the migration history is unchanged and `prisma migrate diff` against a
  database built from it is empty.

---

## ⚙️ Environment Variables

This project uses an `.env` file to configure environment-specific settings. Below are the main environment variables:

| Variable Name                    | Description                                                         | Default Value      |
|----------------------------------|---------------------------------------------------------------------|--------------------|
| `APP_NAME`                       | Application name for identification across services                 | WebServiceTemplate |
| `APP_ENV`                        | Application runtime environment                                     | development        |
| `PORT`                           | Port number where the service runs                                  | 3000               |
| `DATABASE_URL`                   | PostgreSQL URL for the Prisma CLI and runtime (`postgresql://...`)  | none (required to use the database) |
| `DATABASE_POOL_MAX`              | Maximum pooled connections (positive integer)                       | 10                 |
| `DATABASE_CONNECTION_TIMEOUT_MS` | Connection / pool wait timeout in ms (positive integer)             | 10000              |
| `FORCE_PRISMA_QUERY_LOG`         | Log Prisma queries at `info` outside development                    | false              |

For complete configuration, please refer to the `.env.example` file.

---

## 🔧 Module Setup Example

Business modules reside in `src/modules`. Here's an example using a "Hello" module:

### Module Structure

```
src/
  ├── modules/
  │   ├── hello/
  │   │   ├── constants/      # Module-specific constants (e.g., routes, injection tokens)
  │   │   ├── controllers/    # HTTP request handlers
  │   │   ├── dto/            # Request/response schemas
  │   │   ├── model/          # Data models
  │   │   ├── routes/         # Route definitions
  │   │   ├── services/       # Business logic
  │   │   ├── spec/           # Unit tests
  │   │   ├── types/          # Type definitions
  │   │   ├── hello.module.ts # Module configuration & DI registration
  │   │   └── index.ts        # Module exports
  │   └── index.ts            # Aggregated module registration for the application
```

### Module Registration

The aggregated module registration is defined in `src/modules/index.ts`:

```typescript
// src/modules/index.ts
import { IModule } from 'src/core/types';
import { HelloModule } from './hello';

const modules: IModule[] = [
  new HelloModule(), // Register the Hello module
];

export default modules;
```

### Example: Hello Module

The Hello module demonstrates how to register its own dependencies:

```typescript
// src/modules/hello/hello.module.ts
import { BaseModule } from 'src/core/utils';
import { InjectionTokens } from './constants/injection-tokens';
import { HelloRoute } from './routes/hello.route';
import { HelloController } from './controllers/hello.controller';
import { HelloService } from './services/hello.service';

export class HelloModule extends BaseModule {
  registerDependencies() {
    this.registerSingletons([
      [InjectionTokens.HELLO_ROUTE, HelloRoute],
      [InjectionTokens.HELLO_CONTROLLER, HelloController],
      [InjectionTokens.HELLO_SERVICE, HelloService],
    ]);
  }
}
```

### Dependency Registration Helpers

Declare dependencies inside `registerDependencies()` using the helpers below.
`registerDependency()` registers a singleton when its resolver mode is omitted
or explicitly `undefined`:

```typescript
this.registerDependency(InjectionTokens.HELLO_SERVICE, HelloService);
```

Use `registerDependenciesByItems()` when one list needs mixed resolver modes.
Items without a third value still default to singleton:

```typescript
import { InjectionResolverMode } from 'src/core/constants';

this.registerDependenciesByItems([
  [InjectionTokens.DEFAULT_SERVICE, DefaultService],
  [
    InjectionTokens.REQUEST_SERVICE,
    RequestService,
    InjectionResolverMode.SCOPED,
  ],
  [InjectionTokens.WORKER, Worker, InjectionResolverMode.TRANSIENT],
]);
```

Lifetime-specific helpers are available for single and batch registrations:

| Lifetime  | Single registration                   | Batch registration                  |
| --------- | ------------------------------------- | ----------------------------------- |
| Singleton | `registerSingleton(token, classType)` | `registerSingletons(items)`         |
| Scoped    | `registerScoped(token, classType)`    | `registerScopedDependencies(items)` |
| Transient | `registerTransient(token, classType)` | `registerTransients(items)`         |

All registration helpers return the current module, so calls can be chained.
Batch helpers accept readonly arrays and tuples, preserve input order, and
treat empty arrays as chainable no-ops.
Registering a class that extends `BaseRoute` through any helper also adds its
token to route registration automatically.

`PROXY` and `CLASSIC` continue to use the existing registration factory
semantics. They do not combine automatically with the singleton default and
retain the Awilix default transient lifetime.

### Dependency Collection Lifecycle

Each `getRegisterDependencies()` call starts from empty state and runs
`registerDependencies()` again. Declare the same tokens, resolver modes, and
order on every call; changing the dependency graph based on invocation count
is unsupported. Resolver objects may be recreated on each collection.

```typescript
const module = new HelloModule();
const first = module.getRegisterDependencies();
const second = module.getRegisterDependencies();
// Both contain one complete set of the Hello module's declarations.
// Neither collection is extended by later calls.

const modules = [module];
const firstApp = await setupApp(globalDIConfigs, modules);
const secondApp = await setupApp(globalDIConfigs, modules);
// Each application gets a new container and its own singleton instances.
```

The returned collection and its registration tuples are readonly in TypeScript.
`BaseModule` keeps its collection private and returns a defensive array copy;
caller array mutations cannot affect the next collection. Runtime freezing and
deep cloning of Awilix resolvers are not part of this contract.

If registration throws, the original error propagates and partial dependency
registrations are discarded. A retry rebuilds the entire declaration from
empty state.

Route tokens remain in the existing process-wide `Set`. Rebuilding may register
the same route token again, and the `Set` deduplicates it without clearing tokens
from other modules. A failed collection does not roll back route tokens; retrying
the same deterministic declaration completes the set. Reusing the same module
instances is supported; isolating route registries for different application
compositions is outside this contract.

---

## 📦 Deployment

### Building the Application

`build` runs `prisma generate` and then `tsc`, so `build/` contains the
compiled Prisma Client (`build/src/generated/prisma/client.js`).

```bash
  pnpm run build
```

Run the compiled service with production dependencies only:

```bash
  pnpm install --prod --frozen-lockfile
  NODE_PATH=./build node build/index.js
```

### Database Migration

To deploy database changes in a production environment (requires the Prisma
CLI from a full install and an explicitly set `DATABASE_URL`):

```bash
  pnpm run prisma:deploy
```

---

## ❓ FAQ

### How to add a new module?

1. Create a new module directory under `src/modules`
2. Implement necessary components (constants, controllers, services, etc.)
3. Create a module class that extends `BaseModule`
4. Register the new module in `src/modules/index.ts`

### How to configure Swagger documentation?

Swagger documentation is automatically generated through the Fastify Swagger plugin.  
You can use TypeBox in your
controllers to define request and response schemas.

### How to handle database migrations?

Use Prisma CLI commands to manage database migrations:

```bash

# Create a new migration
pnpm run prisma:migrate

# Deploy migrations to production environment
pnpm run prisma:deploy

# Reset a disposable development database (never production)
pnpm run prisma:reset

# Regenerate the Client and seed explicitly afterwards
pnpm run prisma:generate
pnpm run prisma:seed

```

### How to add new environment variables?

1. Add new variables to the `.env.example` file
2. Update the environment configuration schema in `src/core/config`
3. Use environment variables through dependency injection

### How to handle errors?

The framework provides a centralized error handling mechanism. You can:

1. Create custom error classes
2. Throw these errors in controllers or services
3. The global error handler will automatically catch and format responses
