import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import { AppConfigType } from 'src/config/app-config.types';
import { LoggerConfig } from 'src/config/logger/logger.config';
import { Environment } from 'src/global/types/environment.types';
import { AppContainer, WebServer } from 'src/global/types/framework.types';
import { generateRequestId } from 'src/global/utils/uuid';
import {
  getSwaggerConfig,
  getSwaggerUiConfig,
} from 'src/server/swagger/swagger.config';

function createWeb(_container: AppContainer, config: AppConfigType): WebServer {
  const webServer = Fastify({
    logger: LoggerConfig[config.appEnv],
    genReqId: generateRequestId,
  });

  if (config.appEnv !== Environment.PRODUCTION) {
    webServer.register(swagger, getSwaggerConfig(config));
    webServer.register(swaggerUi, getSwaggerUiConfig());
  }

  return webServer;
}

export default createWeb;
