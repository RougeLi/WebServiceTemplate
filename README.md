# Web Service Template

### A foundational template for efficiently developing scalable web service applications.

---

## Features

- **Efficient Development:** Provides a foundational template for developing scalable web services.
- **Modular Design:** Separates core functionalities from business modules for easy maintenance and scalability.
- **Simplified Workflow:** Offers rich script commands to simplify development, testing, and deployment.
- **Enhanced Development Efficiency:** Supports hot reloading and automatic compilation.
- **Integrated Core Functionalities:** Includes built-in dependency injection, configuration management, error handling,
  and more.

**Summary:**

- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
    - [Core Module (`core`)](#core-module-core)
- [Script Commands](#script-commands)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Example Module Setup](#example-module-setup)
- [Development](#development)

---

## Installation

### Prerequisites

- Ensure that the correct version of Node.js is installed (see `.nvmrc` for details).
- Install [pnpm](https://pnpm.io/) globally:

  ```bash
  npm install -g pnpm
  ```

### Installation Steps

1. **Clone the repository and navigate to the project directory:**

   ```bash
   git clone <repository_url>
   cd <project_directory>
   ```

2. **Deploy the local development environment:**  
   (See the [Development](#development) section for details.)

3. **Copy the example environment variable file:**

   ```bash
   cp .env.example .env
   ```

4. **Install dependencies:**

   ```bash
   nvm use  # (Optional: switch to the Node.js version specified in .nvmrc)
   pnpm run install:ci
   ```

5. **Compile TypeScript files:**

   ```bash
   pnpm run build
   ```

6. **Start the development server:**

   ```bash
   pnpm start
   ```

---

## Usage

Use this template as the base for your web service. The framework handles global configurations and dependency
injection. You can focus on developing your business modules in the `src/modules` directory. For debugging and
deployment, follow your standard Node.js application workflows.

---

## Project Structure

The project follows a clear separation between framework core components and business modules:

```plaintext
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
│   │   ├── services/       # Core services (e.g., Logger, Environment)
│   │   ├── types/          # Type definitions and interfaces
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

The `core` directory contains the essential framework components:

- **`app/`**: Application initialization and server setup.
- **`config/`**: Environment loading and configuration management.
- **`constants/`**: Definitions for tokens, modes, and other constants.
- **`di/`**: Dependency injection container, including global DI configurations in `global-di-configs.ts`.
- **`server/`**: Fastify server setup, routing, error handling, and Swagger documentation.
- **`services/`**: Core services like Logger, Environment, etc.
- **`types/`**: Shared TypeScript types and interfaces.
- **`utils/`**: Base classes and helper functions for modules.

### Business Modules

All business or feature modules are organized under `src/modules`. Each module is self-contained and registers its own
dependencies. This design improves clarity and allows modules to be later extracted as independent packages.

---

## Script Commands

The template provides the following useful `pnpm` script commands:

- **install:ci**: Install dependencies with a frozen lockfile (ideal for CI).

  ```bash
  pnpm run install:ci
  ```

- **install:dev**: Install dependencies without freezing the lockfile (for development).

  ```bash
  pnpm run install:dev
  ```

- **build**: Compile TypeScript files.

  ```bash
  pnpm run build
  ```

- **start**: Run the development server with automatic recompilation.

  ```bash
  pnpm start
  ```

- **lint**: Check code quality via linting.

  ```bash
  pnpm run lint
  ```

- **lint:fix**: Automatically fix linting issues.

  ```bash
  pnpm run lint:fix
  ```

- **unittest:coverage**: Run unit tests and generate a coverage report.

  ```bash
  pnpm run unittest:coverage
  ```

---

## Environment Variables

The project uses an `.env` file to configure environment-specific settings. Below is an example configuration:

```bash
# Application name for identification across services
APP_NAME=WebServiceTemplate

# Application runtime environment (development, staging, production)
APP_ENV=development

# Port number where the service runs
PORT=3000
```

---

## Development Workflow

1. **Live Reloading:**  
   During development, changes are automatically compiled and the server is restarted:

   ```bash
   pnpm start
   ```

2. **Code Quality:**  
   Ensure consistent code formatting and style:

   ```bash
   pnpm run lint:fix
   ```

3. **Testing:**  
   Run unit tests and generate coverage reports:

   ```bash
   pnpm run unittest:coverage
   ```

---

## Example Module Setup

Business modules reside in `src/modules`. Here’s an example using a "Hello" module:

### Module Structure

```plaintext
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
import { InjectionResolverMode } from 'src/core/constants';
import { HelloRoute } from './routes/hello.route';
import { HelloController } from './controllers/hello.controller';
import { HelloService } from './services/hello.service';

export class HelloModule extends BaseModule {
  registerDependencies() {
    this.registerDependency(
      InjectionTokens.HELLO_ROUTE,
      HelloRoute,
      InjectionResolverMode.SINGLETON,
    )
      .registerDependency(
        InjectionTokens.HELLO_CONTROLLER,
        HelloController,
        InjectionResolverMode.SINGLETON,
      )
      .registerDependency(
        InjectionTokens.HELLO_SERVICE,
        HelloService,
        InjectionResolverMode.SINGLETON,
      );
  }
}
```

*Additional module files (constants, controllers, services, routes, etc.) follow similar patterns.*

---

## Development

### Setting Up a Local PostgreSQL Database

1. **Install [Docker](https://www.docker.com/).**

2. **Navigate to the project's `.dev-app-projects` directory:**

   ```bash
   cd .dev-app-projects
   ```

3. **Start the Docker containers:**

   ```bash
   docker-compose up -d
   ```

4. **Prepare the database:**  
   Make sure your Prisma models are defined in `schema.prisma` before running migrations.

   ```bash
   pnpm run prisma:migrate
   ```
   or generate the Prisma client:
   ```bash
   pnpm run prisma:generate
   ```
