import { SwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { AppConfigType } from 'src/config/app-config.types';

export const getSwaggerUiConfig = (): FastifySwaggerUiOptions => ({
  routePrefix: '/docs',
  uiConfig: {
    persistAuthorization: true,
    defaultModelsExpandDepth: -1,
    defaultModelExpandDepth: 4,
  },
});

export const getSwaggerConfig = (config: AppConfigType): SwaggerOptions => {
  const securitySchemes: Record<string, { [key: string]: string }> = {};

  if (config.serviceToken) {
    securitySchemes['ServiceAuth'] = {
      type: 'serviceKey',
      description: 'Service APIs signature',
      name: 'x-signature',
      in: 'header',
    };
  }

  securitySchemes['BearerAuth'] = {
    type: 'jwt',
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
      servers: [
        {
          url: config.appDomain,
        },
      ],
      components: {
        securitySchemes,
      },
    },
  } as SwaggerOptions;
};
