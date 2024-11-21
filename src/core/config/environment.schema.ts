import { z } from 'zod';
import { Environment } from 'src/core/constants';
import { AppConfigType } from 'src/core/types';

export const EnvironmentSchema = z.object({
  APP_NAME: z.string().default('ServiceTemplate'),
  APP_ENV: z.nativeEnum(Environment).default(Environment.PRODUCTION),
  APP_DOMAIN: z.string().default('http://localhost:3000'),
  APP_PORT: z.string().regex(/^\d+$/).default('3000'),
  SERVICE_TOKEN: z.string().default(''),
});

export const transformEnvironment = (
  environment: z.infer<typeof EnvironmentSchema>,
): AppConfigType => ({
  appName: environment.APP_NAME,
  appEnv: environment.APP_ENV,
  appDomain: environment.APP_DOMAIN,
  appPort: Number.parseInt(environment.APP_PORT, 10),
  serviceToken: environment.SERVICE_TOKEN,
});
