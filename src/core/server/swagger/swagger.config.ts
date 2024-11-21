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

  if (config.serviceToken) {
    securitySchemes['ServiceAuth'] = {
      type: 'apiKey',
      description: 'Service APIs Authorization',
      name: 'service-token',
      in: 'header',
    };
  }

  securitySchemes['BearerAuth'] = {
    type: 'http',
    description: 'JWT Authorization',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  };

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
