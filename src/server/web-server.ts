import { fastifyAwilixPlugin } from '@fastify/awilix';
import helmet from '@fastify/helmet';
import fastifyRequestContext from '@fastify/request-context';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import { AppConfigType } from 'src/config/app-config.types';
import { EnvironmentService } from 'src/config/environment.service';
import { LoggerConfig } from 'src/config/logger/logger.config';
import ContainerTokens from 'src/global/container-tokens';
import { LoggerService } from 'src/global/services/logger.service';
import { Environment } from 'src/global/types/environment.types';
import { AppContainer, WebServer } from 'src/global/types/framework.types';
import { generateRequestId } from 'src/global/utils/uuid';
import { ErrorLoggerHandler } from 'src/server/handlers/error-logger.handler';
import { ReplyHandler } from 'src/server/handlers/reply.handler';
import {
  getSwaggerConfig,
  getSwaggerUiConfig,
} from 'src/server/swagger/swagger.config';
import { WebError } from 'src/server/web.error';

async function createWeb(
  container: AppContainer,
  config: AppConfigType,
): Promise<WebServer> {
  const webServer = Fastify({
    logger: LoggerConfig[config.appEnv],
    genReqId: generateRequestId,
  });

  webServer.withTypeProvider<TypeBoxTypeProvider>();

  const logger = container.resolve<LoggerService>(ContainerTokens.LOGGER);
  logger.init(webServer.log);

  const environmentService = container.resolve<EnvironmentService>(
    ContainerTokens.ENVIRONMENT_SERVICE,
  );

  const replyHandler = new ReplyHandler();
  const errorLoggerHandler = new ErrorLoggerHandler(logger, environmentService);

  // Register Plugins
  await webServer.register(fastifyAwilixPlugin, {
    disposeOnClose: true,
    disposeOnResponse: true,
  });

  await webServer.register(helmet);
  await webServer.register(fastifyRequestContext);

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

  // Swagger setup for non-production environments
  if (config.appEnv !== Environment.PRODUCTION) {
    await webServer.register(swagger, getSwaggerConfig(config));
    await webServer.register(swaggerUi, getSwaggerUiConfig());
  }

  return webServer;
}

export default createWeb;
