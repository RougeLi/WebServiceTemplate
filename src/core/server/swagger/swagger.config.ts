import { SwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { SecuritySchemes } from 'src/core/server/types';
import { AppConfigType } from 'src/core/types';

export const getSwaggerUiConfig = (): FastifySwaggerUiOptions => ({
  routePrefix: '/docs',
  uiConfig: {
    persistAuthorization: true,
    defaultModelsExpandDepth: -1,
    defaultModelExpandDepth: 4,
  },
});

export const getSwaggerConfig = (config: AppConfigType): SwaggerOptions => {
  const securitySchemes: SecuritySchemes = {};

  const { serviceAuthName } = config;
  if (serviceAuthName) {
    securitySchemes['ServiceAuth'] = {
      type: 'apiKey',
      description: 'Service APIs Authorization',
      name: serviceAuthName,
      in: 'header',
    };
  }

  return {
    openapi: {
      info: {
        title: `${config.appName} APIs`,
        version: 'v1',
      },
      components: {
        securitySchemes,
      },
    },
  } as SwaggerOptions;
};
