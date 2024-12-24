# Web Service Template

### A foundational template for efficiently developing scalable web service applications.

---

## Features

- **Efficient Development:** Provides a foundational template for efficiently developing scalable web services.
- **Modular Design:** Includes a detailed project structure and modular design for easy maintenance and scalability.
- **Simplified Workflow:** Offers rich script commands to simplify development and deployment processes.
- **Enhanced Development Efficiency:** Supports hot reload and automatic compilation, enhancing development efficiency.
- **Core Functionalities Integrated:** Integrates core functionalities such as dependency injection, configuration
  management, and error handling.

`Summary`:

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

- Ensure that the correct version of Node.js is installed. You can refer to the `.nvmrc` file for the specific version.
- Install [pnpm](https://pnpm.io/) globally:

  ```bash
  npm install -g pnpm
  ```

### Installation Steps

1. **Clone the repository and navigate to the project directory:**

   ```bash
   git clone <repository_url>
   ```

   ```bash
   cd <project_directory>
   ```
2. **Deploy the Local development environment:**  
   See the [Development](#development) section for more details.

3. **Copy the example environment variable file:**

   ```bash
   cp .env.example .env
   ```

4. **Install dependencies:**

   ```bash
   nvm use # Optional, switch to the correct Node.js version based on .nvmrc
   ```

   ```bash
   pnpm run install:ci
   ```

5. **Run the initial TypeScript compilation:**

   ```bash
   pnpm run build
   ```

6. **Start the development server:**

   ```bash
   pnpm start
   ```

---

## Usage

Provide detailed instructions on how to use the template, including running, debugging, and deploying the application.

---

## Project Structure

```plaintext
├── README.md
├── index.ts                # Entry point of the application
├── package.json
├── tsconfig.json
├── tsconfig.eslint.json
├── eslint.config.js
├── jest.config.js
├── pnpm-lock.yaml
├── node_modules/
├── src/
│   ├── core/
│   │   ├── app/            # Application initialization and setup
│   │   ├── config/         # Configuration and environment management
│   │   ├── constants/      # Application constants and enums
│   │   ├── di/             # Dependency injection container setup
│   │   ├── server/         # Web server setup, routing, and error handling
│   │   ├── services/       # Core services
│   │   ├── types/          # Type definitions and interfaces
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Core module exports
│   ├── modules/
│   │   ├── hello/          # Hello module
│   │   └── index.ts        # Module registration and startup
│   └── index.ts            # Entry point of the src directory
├── test-utils/
│   ├── containers/
│   │   ├── test-container.ts
│   │   └── index.ts        # Test container exports
│   └── mocks/
│       ├── environment.mock.ts
│       ├── logger.mock.ts
│       └── index.ts        # Mock exports
```

### Core Module (`core`)

The `core` directory contains the core logic and setup of the application, including initialization, configuration,
dependency injection, server setup, and common services.

#### `core/app/`

- **`application.ts`**: The main entry point of the application, responsible for starting the app.
- **`setup-app.ts`**: Sets up the required configurations and middleware for the application.
- **`di-container.ts`**: Initializes and configures the dependency injection container.
- **`app.types.ts`**: Type definitions related to the application.
- **`index.ts`**: Exports the app module.
- **`spec/`**: Test files for the application.

#### `core/config/`

- **`environment.schema.ts`**: Validation schema for environment variables.
- **`load-environment.ts`**: Loads and validates environment variables.
- **`logger.config.ts`**: Logger configurations.
- **`index.ts`**: Exports the config module.
- **`spec/`**: Test files for the config module.

#### `core/constants/`

- **`environment.ts`**: Defines the environment types of the application.
- **`container-tokens.ts`**: Token definitions for the dependency injection container.
- **`injection-resolver-mode.ts`**: Enum for injection resolver modes.
- **`log-levels.ts`**: Definitions of log levels.
- **`index.ts`**: Exports the constants module.

#### `core/di/`

- **`global-containers.ts`**: Setup of the global dependency injection containers.
- **`index.ts`**: Exports the DI module.

#### `core/server/`

- **`bootstrap/`**: Bootstrap files for the server.
    - **`web-server.ts`**: Creates and configures the Fastify server instance.
    - **`index.ts`**: Exports the bootstrap module.
- **`dto/`**: Common Data Transfer Objects (DTO) for the server.
    - **`common.dto.ts`**: Common DTO definitions.
    - **`index.ts`**: Exports the DTO module.
- **`errors/`**: Server error definitions.
    - **`bad-request.error.ts`**: Handles 400 errors.
    - **`not-found.error.ts`**: Handles 404 errors.
    - **`unauthorized.error.ts`**: Handles 401 errors.
    - **`index.ts`**: Exports the errors module.
- **`handlers/`**: Error and response handlers.
    - **`error-logger.handler.ts`**: Error logging handler.
    - **`reply.handler.ts`**: Reply handler.
    - **`route.handler.ts`**: Route handler.
    - **`index.ts`**: Exports the handlers module.
    - **`spec/`**: Test files for handlers.
- **`swagger/`**: Swagger configuration.
    - **`swagger.config.ts`**: Settings for Swagger.
    - **`index.ts`**: Exports the Swagger module.
- **`types/`**: Type definitions related to the server.
    - **`swagger.types.ts`**: Swagger type definitions.
    - **`index.ts`**: Exports the types module.
- **`index.ts`**: Exports the server module.

#### `core/services/`

- **`logger.service.ts`**: Logger service.
- **`environment.service.ts`**: Environment service.
- **`index.ts`**: Exports the services module.
- **`spec/`**: Test files for services.

#### `core/types/`

- **`di.types.ts`**: Type definitions related to dependency injection.
- **`app-config.types.ts`**: Application configuration type definitions.
- **`module.types.ts`**: Module type definitions.
- **`request-context.types.ts`**: Request context type definitions.
- **`index.ts`**: Exports the types module.

#### `core/utils/`

- **`base.module.ts`**: Base class definition for modules.
- **`base.route.ts`**: Base class definition for routes.
- **`di-registration-factory.ts`**: Factory functions for dependency registration.
- **`uuid.ts`**: Utility for UUID generation.
- **`web.error.ts`**: Web error definitions.
- **`index.ts`**: Exports the utils module.
- **`spec/`**: Test files for utils.

---

## Script Commands

This template provides useful pnpm script commands to assist with development and project maintenance:

- **install:ci**: Installs dependencies using a frozen lockfile, ideal for CI environments.

  ```bash
  pnpm install --frozen-lockfile
  ```

- **install:dev**: Installs dependencies without freezing the lockfile, suitable for development.

  ```bash
  pnpm install --no-frozen-lockfile
  ```

- **build**: Compiles TypeScript files into JavaScript.

  ```bash
  pnpm run build
  ```

- **start**: Runs both TypeScript compilation and server with code change monitoring.

  ```bash
  pnpm start
  ```

- **lint**: Runs type checking and linting to ensure code quality.

  ```bash
  pnpm run lint
  ```

- **lint:fix**: Automatically fixes formatting and linting issues.

  ```bash
  pnpm run lint:fix
  ```

- **unit-test:coverage**: Runs tests and generates a coverage report to verify the completeness of the tests.

  ```bash
  pnpm run unit-test:coverage
  ```

---

## Environment Variables

The environment settings for the project are stored in the `.env` file. Below is an example configuration:

```bash
# Application name, identifies the app across services
APP_NAME=WebServiceTemplate

# Application runtime environment (development, staging, production)
APP_ENV=development

# Port number where the service runs, adjustable based on deployment environment
PORT=3000
```

---

## Development Workflow

1. **Monitoring Changes**: During development, the project watches for file changes and automatically recompiles and
   restarts the server:

   ```bash
   pnpm start
   ```

2. **Automatic Fixes and Formatting**: Ensure code follows project standards and automatically fix issues:

   ```bash
   pnpm run lint:fix
   ```

3. **Testing and Coverage**: Use Jest for testing and generate test coverage reports:

   ```bash
   pnpm run unitest:coverage
   ```

---

## Example Module Setup

### Module Structure

```plaintext
src/
  ├── modules/
  │   ├── hello/              # Hello module-related files
  │   │   ├── constants/      # Module-specific constants
  │   │   │   ├── hello-routes.ts
  │   │   │   └── injection-tokens.ts
  │   │   ├── controllers/    # Controller layer handling HTTP requests
  │   │   │   └── hello.controller.ts
  │   │   ├── dto/            # Data Transfer Objects (DTOs), defining request and response formats
  │   │   │   └── hello.dto.ts
  │   │   ├── model/          # Data models
  │   │   │   └── hello.model.ts
  │   │   ├── services/       # Business logic
  │   │   │   └── hello.service.ts
  │   │   ├── spec/           # Unit tests
  │   │   │   ├── *.spec.ts
  │   │   │   └── ...
  │   │   ├── types/          # Type definitions
  │   │   │   └── hello.types.ts
  │   │   ├── hello.route.ts  # Route registration
  │   │   ├── hello.module.ts # Module configuration file
  │   │   └── index.ts        # Module exports
  │   └── index.ts            # Module registration and startup
```

### Module Configuration

In `src/modules/index.ts`, register the Hello module:

```typescript
// src/modules/index.ts

import { IModule } from 'src/core/types';
import { HelloModule } from './hello';

const modules: IModule[] = [
  new HelloModule(), // Register the Hello module
];

export default modules;
```

### Hello Module

The Hello module contains controllers, services, and routes, and is registered for dependency injection in the module
configuration file:

```typescript
// src/modules/hello/hello.module.ts

import { BaseModule } from 'src/core/utils';
import { InjectionTokens } from './constants/injection-tokens';
import { InjectionResolverMode } from 'src/core/constants';
import { HelloRoute } from './routes/hello.route';
import { HelloController } from './controllers/hello.controller';
import { HelloService } from './services/hello.service';

export class HelloModule extends BaseModule {
  // Register module dependencies
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

### Define Constants

In the `constants` directory, define the `HelloRoutes` and `InjectionTokens` enums.

```typescript
export enum HelloRoutes {
  HELLO = '/hello',
}
```

```typescript
export enum InjectionTokens {
  HELLO_ROUTE = 'helloRoute',
  HELLO_CONTROLLER = 'helloController',
  HELLO_SERVICE = 'helloService',
}
```

### Define Types

In the `types` directory, define the types related to the Hello module.

```typescript
export type SayHelloQueryType = Static<typeof SayHelloQuery>;

export type SayHelloRequestType = FastifyRequest<{
  Querystring: SayHelloQueryType;
}>;
```

### Register Routes

```typescript
export class HelloRoute extends BaseRoute {
  constructor(private readonly helloController: HelloController) {
    super();
  }

  registerRoutes(webServer: WebServer) {
    webServer.get(
      HelloRoutes.HELLO,
      SayHelloSchema,
      this.helloController.sayHello,
    );
  }
}
```

### Create Models, Services, and Controllers

```typescript
export class HelloController {
  constructor(private readonly helloService: HelloService) {
  }

  sayHello = (request: SayHelloRequestType) => {
    const { query } = request;
    return this.helloService.sayHello(query);
  };
}

export class HelloService {
  constructor(
    private readonly logger: LoggerService,
    private readonly helloModel: HelloModel,
  ) {
  }

  async sayHello(query: SayHelloQueryType): Promise<string> {
    const { name, age } = query;
    const Name = name ? name : 'guys';
    const Age = age ? age : 18;
    this.logger.info(`Saying hello to ${Name}...`);
    await this.helloModel.saveUser(Name, Age);

    if (Age < 18) {
      return `Hello ${Name}! You are still young.`;
    }
    return `Hello ${Name}!`;
  }
}

export class HelloModel {
  constructor(private readonly prisma: PrismaService) {
  }

  async saveUser(Name: string, Age: number): Promise<void> {
    const data = { Name, Age };
    await this.prisma.user.create({
      data,
    });
  }
}
```

### Define Request and Response Formats for Routes

```typescript
export const SayHelloQuery = Type.Object({
  name: Type.Optional(
    Type.String({
      description: 'The name of the person to greet, used for personalized greetings.',
      examples: ['YueYue'],
    }),
  ),
  age: Type.Optional(
    Type.Number({
      description:
        'The person’s age, though not directly used in the greeting message, can be logged or processed.',
      examples: [18],
    }),
  ),
});

export const SayHelloResponse = Type.String({
  description: 'A personalized greeting message generated based on the provided query parameters.',
  examples: ['Hello YueYue!'],
});

export const SayHelloSchema = {
  schema: {
    querystring: SayHelloQuery,
    response: {
      ...CommonSchema,
      [StatusCodes.OK]: SayHelloResponse,
    },
    description:
      'This endpoint generates a greeting message based on the provided name and age. If no name is given, the default message will be returned.',
    summary: 'Generates a personalized greeting message.',
    tags: ['hello'],
  },
};
```

---

## Development

### Setting Up a Local `PostgreSQL` Database

1. **Install [Docker](https://www.docker.com/).**

2. **Navigate to the project's `.dev-app-projects` directory:**

   ```bash
    cd .dev-app-projects
   ```

3. **Run the following command:**

   ```bash
    docker-compose up -d
   ```

4. **Prepare the database:**

   **Note**: Ensure that at least one Prisma model is defined in the `schema.prisma` file before running `migrate dev`
   or `generate`.

   ```bash
    npx prisma migrate dev
   ```

   or generate the Prisma client:

   ```bash
    npx prisma generate
   ```
