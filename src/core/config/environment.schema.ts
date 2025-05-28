import { z } from 'zod';
import { Environment } from 'src/core/constants';
import { AppConfigType } from 'src/core/types';

const booleanOptionalDefaultFalse = z.optional(
  z
    .string()
    .default('false')
    .transform((val) => val === 'true')
    .pipe(z.boolean()),
);

export const EnvironmentSchema = z.object({
  APP_NAME: z.string().default('ServiceTemplate'),
  APP_ENV: z.nativeEnum(Environment).default(Environment.PRODUCTION),
  PORT: z.string().regex(/^\d+$/).default('3000'),
  SERVICE_AUTH_NAME: z.string().default('x-secret-key'),
  SECRET_KEY: z.string().default('ServiceTemplate'),
  FORCE_PRISMA_QUERY_LOG: booleanOptionalDefaultFalse,
  PRISMA_QUERY_MAX_STR_LEN: z.optional(z.number()),
  PRISMA_QUERY_ENABLE_JSON_PARSE: booleanOptionalDefaultFalse,
  PRISMA_QUERY_DELIMITER: z.optional(z.string()),
  REDIS_HOST: z.optional(z.string()),
  REDIS_PORT: z.optional(z.string()),
  REDIS_PASSWORD: z.optional(z.string()),
  REDIS_DB: z.optional(z.string()),
  REDIS_KEY_PREFIX: z.optional(z.string()).default('app'),
  REDIS_KEY_SEPARATOR: z.optional(z.string()).default(':'),
});

export const transformEnvironment = (
  environment: z.infer<typeof EnvironmentSchema>,
): AppConfigType => ({
  appName: environment.APP_NAME,
  appEnv: environment.APP_ENV,
  appPort: Number.parseInt(environment.PORT, 10),
  serviceAuthName: environment.SERVICE_AUTH_NAME,
  secretKey: environment.SECRET_KEY,
  forcePrismaQueryLog: environment.FORCE_PRISMA_QUERY_LOG,
  prismaQueryMaxStrLen: environment.PRISMA_QUERY_MAX_STR_LEN,
  prismaQueryEnableJsonParse: environment.PRISMA_QUERY_ENABLE_JSON_PARSE,
  prismaQueryDelimiter: environment.PRISMA_QUERY_DELIMITER,
  redisConfig: environment.REDIS_HOST
    ? {
        host: environment.REDIS_HOST,
        port: Number.parseInt(environment.REDIS_PORT ?? '6379', 10),
        password: environment.REDIS_PASSWORD,
        db: environment.REDIS_DB
          ? Number.parseInt(environment.REDIS_DB, 10)
          : undefined,
        keyPrefix: environment.REDIS_KEY_PREFIX,
        keySeparator: environment.REDIS_KEY_SEPARATOR,
      }
    : undefined,
});
