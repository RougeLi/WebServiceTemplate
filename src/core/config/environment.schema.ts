import { z } from 'zod';
import { Environment } from 'src/core/constants';
import { AppConfigType } from 'src/core/types';

export const EnvironmentSchema = z.object({
  APP_NAME: z.string().default('ServiceTemplate'),
  APP_ENV: z.nativeEnum(Environment).default(Environment.PRODUCTION),
  PORT: z.string().regex(/^\d+$/).default('3000'),
  SERVICE_TOKEN: z.string().default(''),
  FORCE_PRISMA_QUERY_LOG: z
    .string()
    .default('false')
    .transform((val) => val === 'true')
    .pipe(z.boolean()),
});

export const transformEnvironment = (
  environment: z.infer<typeof EnvironmentSchema>,
): AppConfigType => ({
  appName: environment.APP_NAME,
  appEnv: environment.APP_ENV,
  appPort: Number.parseInt(environment.PORT, 10),
  serviceToken: environment.SERVICE_TOKEN,
  forcePrismaQueryLog: environment.FORCE_PRISMA_QUERY_LOG,
});
