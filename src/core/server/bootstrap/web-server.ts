import { fastifyAwilixPlugin } from '@fastify/awilix';
import helmet from '@fastify/helmet';
import fastifyRequestContext from '@fastify/request-context';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import { LoggerConfig } from 'src/core/config';
import { ContainerTokens, Environment } from 'src/core/constants';
import { EnvironmentService, LoggerService } from 'src/core/services';
import { AppConfigType, AppContainer, WebServer } from 'src/core/types';
import { generateRequestId } from 'src/core/utils';
import {
  WebError,
  ErrorLoggerHandler,
  ReplyHandler,
  getSwaggerConfig,
  getSwaggerUiConfig,
} from '../index';

export async function createWebServer(
  container: AppContainer,
  config: AppConfigType,
): Promise<WebServer> {
  // Initialize Fastify server instance
  const webServer = await initializeWebServer(config);

  // Resolve LoggerService and initialize it
  const loggerService = container.resolve<LoggerService>(
    ContainerTokens.LOGGER,
  );
  loggerService.init(webServer.log);

  // Resolve EnvironmentService
  const environmentService = container.resolve<EnvironmentService>(
    ContainerTokens.ENVIRONMENT,
  );

  // Instantiate reply and error handlers
  const replyHandler = new ReplyHandler();
  const errorLoggerHandler = new ErrorLoggerHandler(
    loggerService,
    environmentService,
  );

  // Set request-specific logger
  webServer.addHook('onRequest', (request, _reply, done) => {
    request.requestContext.set('logger', request.log);
    done();
  });

  // Error handling
  webServer.setErrorHandler((error: Error, _request, reply) => {
    if (error instanceof WebError) {
      errorLoggerHandler.logError(error);
      replyHandler.handle(reply, error);
      return;
    }
    errorLoggerHandler.internalError(error);
    replyHandler.handleInternalError(reply);
  });

  // Register the default route
  webServer.all('/', (_request, reply) => {
    reply.type('text/html').send(generateDefaultPage(config.appName));
  });

  // Swagger setup for non-production environments
  if (config.appEnv !== Environment.PRODUCTION) {
    await webServer.register(swagger, getSwaggerConfig(config));
    await webServer.register(swaggerUi, getSwaggerUiConfig());
  }

  return webServer;
}

async function initializeWebServer(config: AppConfigType): Promise<WebServer> {
  // Create Fastify instance with configuration
  const webServer = Fastify({
    logger: LoggerConfig[config.appEnv],
    genReqId: generateRequestId,
  });

  // Set TypeBox as the type provider
  webServer.withTypeProvider<TypeBoxTypeProvider>();

  // Register plugins
  await webServer.register(fastifyAwilixPlugin, {
    disposeOnClose: true,
    disposeOnResponse: true,
  });
  await webServer.register(helmet);
  await webServer.register(fastifyRequestContext);

  return webServer;
}

function generateDefaultPage(appName: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName} Welcome Page</title>
  </head>
  <body>
    <h1>Welcome to the ${appName} API</h1>
  </body>
</html>
  `.trim();
}
