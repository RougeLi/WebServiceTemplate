# Web Service Template

[![Node.js](https://img.shields.io/badge/Node.js-Latest-339933?style=flat&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.x-000000?style=flat&logo=fastify)](https://www.fastify.io/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PNPM](https://img.shields.io/badge/PNPM-Latest-F69220?style=flat&logo=pnpm)](https://pnpm.io)

A foundational template for efficiently developing scalable web service applications.

## 📋 Table of Contents

- [📝 Project Introduction](#-project-introduction)
- [🚀 Quick Start](#-quick-start)
- [📂 Project Structure](#-project-structure)
- [🏗 System Architecture](#-system-architecture)
- [💻 Development Guide](#-development-guide)
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

   ```bash
   pnpm run build
   ```

6. **Start the development server**

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
   Make sure your Prisma models are defined in `schema.prisma` before running migrations.
   ```bash
   pnpm run prisma:migrate
   ```
   Or generate the Prisma client:
   ```bash
   pnpm run prisma:generate
   ```

---

## ⚙️ Environment Variables

This project uses an `.env` file to configure environment-specific settings. Below are the main environment variables:

| Variable Name | Description                                         | Default Value      |
|---------------|-----------------------------------------------------|--------------------|
| `APP_NAME`    | Application name for identification across services | WebServiceTemplate |
| `APP_ENV`     | Application runtime environment                     | development        |
| `PORT`        | Port number where the service runs                  | 3000               |

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

```bash
  pnpm run build
```

### Database Migration

To deploy database changes in a production environment:

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

# Reset database (development environment)
pnpm run prisma:reset

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
