# Web Service Template

## Key Features

- **Fastify Framework**: A lightweight and efficient web framework, perfect for building high-performance web services.
- **TypeScript Support**: Enhances type safety, improving code readability and maintainability.
- **Dependency Injection**: Managed by Awilix, promoting modular design and separation of concerns.
- **Environment Variable Management**: Utilizes `@fastify/env` for loading and validating configurations, ensuring
  consistency across environments.
- **Template Purpose**: This template is designed to provide a foundational setup for rapid development of web service
  projects, reducing initial configuration time and focusing on business logic.

---

## Installation

### Prerequisites

- Ensure that the correct version of Node.js is installed. You can refer to the `.nvmrc` file for the specific version.

### Installation Steps

1. Clone the repository and navigate to the project directory:

   ```bash
   git clone <repository_url>
   cd <repository_directory>
   ```

2. Copy the example environment variable file:

   ```bash
   cp .env.example .env
   ```

3. Install dependencies:

   ```bash
   nvm use # Optional, switch to the correct Node.js version based on .nvmrc
   npm install:ci
   ```

4. Run the initial TypeScript compilation:

   ```bash
   npm run build
   ```

5. Start the development server:

   ```bash
   npm start
   ```

---

## Script Commands

This template provides useful npm script commands to assist with development and project maintenance:

- **install:ci**: Installs dependencies using a frozen lockfile, ideal for CI environments.
- **install:dev**: Installs dependencies without freezing the lockfile, suitable for development.
- **build**: Compiles TypeScript files into JavaScript.
- **build:watch**: Watches for file changes and automatically recompiles TypeScript files.
- **start**: Runs both TypeScript compilation and server with code change monitoring.
- **run:watch**: Runs the server in watch mode, automatically restarting on changes.
- **prettier:check**: Checks code formatting with Prettier.
- **prettier:fix**: Automatically fixes code formatting issues.
- **type:check**: Runs TypeScript type checking to ensure code follows type rules.
- **lint**: Runs type checking and linting to ensure code quality.
- **lint:code**: Uses ESLint to check for potential issues in the code.
- **lint:fix**: Automatically fixes formatting and linting issues.
- **pretest**: Runs code checks before executing tests.
- **test**: Runs unit tests with Jest, ensuring code functionality.
- **test:coverage**: Runs tests and generates a coverage report to verify the completeness of the tests.

---

## Environment Variables

The environment settings for the project are stored in the `.env` file. Below is an example configuration:

```bash
// Application name, identifies the app across services
APP_NAME=WebServiceTemplate

// Application runtime environment (development, staging, production)
APP_ENV=development

// Domain and Swagger path for API documentation and testing
APP_DOMAIN=http://localhost:3000

// Port number where the service runs, adjustable based on deployment environment
APP_PORT=3000
```

---

## Project Structure

```text
src/
  ├── app/                # Application entry point and primary setup files
  ├── config/             # Application configuration and environment management
  ├── global/             # Shared services, utilities, DI container registration, and type definitions
  ├── server/             # Web server setup, routing, and error handling
  ├── global-container.ts # Global DI container registration for dependency injection
  └── modules.ts          # Application module registration and startup
tests/                    # Unit tests and mock data
```

- `app/`: Contains the application’s initialization, startup logic, and related settings.
- `config/`: Manages the application’s configuration files and environment variables, ensuring flexibility across
  different environments.
- `global/`: Defines global services, utilities, and handles DI (Dependency Injection) registration logic.
- `server/`: Manages server logic, routing, and error handling mechanisms.
- `tests/`: Contains unit tests and relevant mock files to ensure the functionality of the application.

---

## Development Workflow

1. **Monitoring Changes**: During development, the project watches for file changes and automatically recompiles and
   restarts the server:

   ```bash
   npm start
   ```

2. **Automatic Fixes and Formatting**: Ensure code follows project standards and automatically fix issues:

   ```bash
   npm run lint:fix
   ```

3. **Testing and Coverage**: Use Jest for testing and generate test coverage reports:

   ```bash
   npm test:coverage
   ```

---

## Example Module Setup

### Module Structure

```text
src/
  ├── hello/              # Hello module-related files
  │   ├── controllers/    # Controller layer handling HTTP requests
  │   │   └── hello.controller.ts
  │   ├── dto/            # Data Transfer Objects (DTOs), defining request and response formats
  │   │   └── hello.dto.ts
  │   ├── routes/         # Route layer, defining API paths
  │   │   └── hello.route.ts
  │   ├── services/       # Service layer, handling business logic
  │   │   └── hello.service.ts
  │   ├── spec/           # Unit tests
  │   │   ├── hello.controller.spec.ts
  │   │   └── hello.service.spec.ts
  │   ├── types/          # Type definitions and module configuration files
  │   │   ├── hello.types.ts
  │   │   └── hello.module.ts
  └── modules.ts          # Module registration and startup
```

### Module Configuration

In `modules.ts`, register the Hello module:

```typescript
import { IModule } from 'src/global/types/module.types';
import { HelloModule } from 'src/hello/hello.module';

const modules: IModule[] = [
  new HelloModule() // Register the Hello module
];

export default modules;
```

### Hello Module

The Hello module contains controllers, services, and routes, and is registered for dependency injection in the module
configuration file:

```typescript
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

### Define Hello Module Types

```typescript
export enum Routes {
  HELLO = '/hello',
}

export enum InjectionTokens {
  HELLO_ROUTE = 'helloRoute',
  HELLO_CONTROLLER = 'helloController',
  HELLO_SERVICE = 'helloService',
}

export type SayHelloQueryType = Static<typeof SayHelloQuery>;

export type SayHelloRequestType = FastifyRequest<{
  Querystring: SayHelloQueryType;
}>;
```

### Register Routes

- BaseRoute is an abstract class defining the basic structure of routes.
- The child classes of BaseRoute register routes by calling the `registerRoutes` method through the DI system.
- HelloRoute extends BaseRoute and implements the `registerRoutes` method.

```typescript
export class HelloRoute extends BaseRoute {
  constructor(private readonly helloController: HelloController) {
    super();
  }

  registerRoutes(webServer: WebServer) {
    webServer.get(
      Routes.HELLO,
      SayHelloSchema,
      this.helloController.sayHello.bind(this.helloController),
    );
  }
}
```

### Create Services Using Any Architecture

In the common MVC design pattern, resources required by each layer can be injected using the DI system.

```typescript
export class HelloController {
  constructor(private readonly helloService: HelloService) {
  }

  sayHello(request: SayHelloRequestType) {
    const { query } = request;
    return this.helloService.sayHello(query);
  }
}

export class HelloService {
  constructor(private readonly logger: LoggerService) {
  }

  sayHello(query: SayHelloQueryType): string {
    const message = query.name ? `Hello ${query.name}!` : 'Hello guys!';
    this.logger.info(message);
    return message;
  }
}
```

### Define Request and Response Formats for Routes

Fastify supports automatic generation of JSON Schema and Swagger pages, so you can define request and response formats
using TypeBox.

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
    description: 'This endpoint generates a greeting message based on the provided name and age. If no name is given, the default message will be returned.',
    summary: 'Generates a personalized greeting message.',
    tags: ['hello'],
  },
};
```
