import fastifyRequestContext from '@fastify/request-context';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import { AppConfigType } from 'src/config/app-config.types';
import { LoggerConfig } from 'src/config/logger/logger.config';
import ContainerTokens from 'src/global/container-tokens';
import { LoggerService } from 'src/global/services/logger.service';
import { Environment } from 'src/global/types/environment.types';
import { AppContainer, WebServer } from 'src/global/types/framework.types';
import { generateRequestId } from 'src/global/utils/uuid';
import {
  getSwaggerConfig,
  getSwaggerUiConfig,
} from 'src/server/swagger/swagger.config';

function createWeb(container: AppContainer, config: AppConfigType): WebServer {
  const webServer = Fastify({
    logger: LoggerConfig[config.appEnv],
    genReqId: generateRequestId,
  });

  webServer.register(fastifyRequestContext);
  webServer.addHook('onRequest', (request, _reply, done) => {
    request.requestContext.set('logger', request.log);
    done();
  });

  const logger = container.resolve<LoggerService>(ContainerTokens.LOGGER);
  logger.init(webServer.log);

  if (config.appEnv !== Environment.PRODUCTION) {
    webServer.register(swagger, getSwaggerConfig(config));
    webServer.register(swaggerUi, getSwaggerUiConfig());
  }

  return webServer;
}

export default createWeb;
