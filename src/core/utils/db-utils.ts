import {
  CustomPrismaClient,
  FormatQueryEventOptions,
  ILoggerService,
  ParsedDatabaseUrl,
  PrismaLogLevels,
  PrismaQueryEvent,
} from 'src/core/types';

enum LogLevel {
  query = 'query',
  info = 'info',
  warn = 'warn',
  error = 'error',
}

const TRUNCATED_STRING = '... (truncated)';

const MAX_STRING_LENGTH = 1000;

const SUPPORTED_DATABASE_URL_PROTOCOLS = new Set(['postgres:', 'postgresql:']);

/**
 * Prisma 6 connection URL parameters that the pg driver used by
 * `@prisma/adapter-pg` does not apply. Pool size and timeouts are configured
 * through DATABASE_POOL_MAX and DATABASE_CONNECTION_TIMEOUT_MS instead.
 */
const IGNORED_PRISMA6_URL_PARAMETERS = [
  'connection_limit',
  'pool_timeout',
  'connect_timeout',
  'socket_timeout',
  'pgbouncer',
  'statement_cache_size',
  'channel_binding',
  'sslaccept',
  'sslidentity',
  'sslpassword',
];

/**
 * Driver adapter error kinds that will not resolve by retrying.
 * See `error.meta.driverAdapterError.cause.kind`.
 */
const FAIL_FAST_DRIVER_ADAPTER_ERROR_KINDS = new Set([
  'AuthenticationFailed',
  'DatabaseDoesNotExist',
  'DatabaseAccessDenied',
  'TlsConnectionError',
]);

/**
 * SQLSTATE 42501 (insufficient_privilege). On the readiness query it means
 * the role lacks CONNECT on the database; the adapter reports it as the
 * generic `postgres` kind rather than `DatabaseAccessDenied` (28000).
 */
const INSUFFICIENT_PRIVILEGE_SQLSTATE = '42501';

/**
 * pg rejects a missing password with a plain Error (no SQLSTATE, so no
 * driver adapter `kind`) when the server asks for SCRAM authentication.
 */
const MISSING_PASSWORD_ERROR_MESSAGE = 'client password must be a string';

/**
 * Thrown when the database connection settings are missing or invalid.
 * The message never contains the connection string.
 */
export class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConfigurationError';
  }
}

/**
 * Validates DATABASE_URL before a driver adapter is created.
 *
 * pg silently falls back to its defaults (localhost:5432 and the OS user)
 * when the connection string is undefined, empty or has no host, and parses
 * a non-URL value such as `not-a-url` relative to a dummy URL, connecting to
 * an unintended host. This check fails first, without echoing the URL.
 */
export function parseDatabaseUrl(
  databaseUrl: string | undefined,
): ParsedDatabaseUrl {
  const connectionString = databaseUrl?.trim();
  if (!connectionString) {
    throw new DatabaseConfigurationError('DATABASE_URL is not set or empty.');
  }

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new DatabaseConfigurationError('DATABASE_URL is not a valid URL.');
  }

  if (!SUPPORTED_DATABASE_URL_PROTOCOLS.has(url.protocol)) {
    throw new DatabaseConfigurationError(
      'DATABASE_URL must use the postgresql:// or postgres:// scheme.',
    );
  }

  if (!url.hostname && !url.searchParams.get('host')) {
    throw new DatabaseConfigurationError('DATABASE_URL must include a host.');
  }

  const schema = url.searchParams.get('schema')?.trim() || undefined;
  const ignoredParameters = IGNORED_PRISMA6_URL_PARAMETERS.filter((name) =>
    url.searchParams.has(name),
  );

  return {
    connectionString,
    schema,
    ignoredParameters,
    hasOptionsParameter: url.searchParams.has('options'),
  };
}

/**
 * Builds the pg `options` startup parameter that sets `search_path` to
 * `schema`, the equivalent of Prisma 6's per-connection
 * `SET search_path = "<schema>"`. The identifier is double-quoted, and
 * backslashes and whitespace are escaped for the server's option parser.
 */
export function buildSearchPathOption(schema: string): string {
  const quoted = `"${schema.replaceAll('"', '""')}"`;
  return `-c search_path=${quoted.replaceAll(/[\\\s]/g, (char) => `\\${char}`)}`;
}

type DriverAdapterErrorCause = {
  kind?: unknown;
  code?: unknown;
  originalCode?: unknown;
};

function getDriverAdapterErrorCause(
  error: unknown,
): DriverAdapterErrorCause | undefined {
  return (
    error as {
      meta?: { driverAdapterError?: { cause?: DriverAdapterErrorCause } };
    } | null
  )?.meta?.driverAdapterError?.cause;
}

/**
 * Returns `error.meta.driverAdapterError.cause.kind`, the driver adapter's
 * classification of a database error, or undefined for other errors.
 */
export function getDriverAdapterErrorKind(error: unknown): string | undefined {
  const kind = getDriverAdapterErrorCause(error)?.kind;
  return typeof kind === 'string' ? kind : undefined;
}

/**
 * Whether a readiness failure must stop startup instead of being retried:
 * configuration errors, authentication / access / TLS failures (including a
 * revoked CONNECT privilege, SQLSTATE 42501), a missing database and a
 * missing password. Everything else (unreachable host, socket timeout, closed
 * connection, too many connections, plain errors such as the pg connection
 * timeout) is treated as temporary.
 */
export function isFailFastConnectionError(error: unknown): boolean {
  if (error instanceof DatabaseConfigurationError) {
    return true;
  }

  const kind = getDriverAdapterErrorKind(error);
  if (kind !== undefined) {
    return (
      FAIL_FAST_DRIVER_ADAPTER_ERROR_KINDS.has(kind) ||
      (kind === 'postgres' &&
        getDriverAdapterErrorCause(error)?.code ===
          INSUFFICIENT_PRIVILEGE_SQLSTATE)
    );
  }

  return (
    error instanceof Error &&
    error.message.includes(MISSING_PASSWORD_ERROR_MESSAGE)
  );
}

function describeConnectionError(error: unknown): string {
  const kind = getDriverAdapterErrorKind(error);
  if (kind !== undefined) {
    const code = getDriverAdapterErrorCause(error)?.code;
    return kind === 'postgres' && typeof code === 'string'
      ? `${kind} ${code}`
      : kind;
  }
  return error instanceof Error ? error.name : typeof error;
}

function setupLogging(
  logger: ILoggerService,
  logLevels: PrismaLogLevels,
  {
    forceQueryLog,
    maxStrLen,
    enableJsonParse,
    delimiter,
  }: FormatQueryEventOptions,
  prisma: CustomPrismaClient,
): void {
  logLevels.forEach((level) => {
    switch (level) {
      case LogLevel.query:
        prisma.$on(LogLevel.query, (event) => {
          forceQueryLog
            ? logger.info(
                formatQueryEvent(maxStrLen, enableJsonParse, delimiter)(event),
              )
            : logger.debug(
                formatQueryEvent(maxStrLen, enableJsonParse, delimiter)(event),
              );
        });
        return;
      case LogLevel.info:
        prisma.$on(LogLevel.info, (event) => logger.info(event));
        return;
      case LogLevel.warn:
        prisma.$on(LogLevel.warn, (event) => logger.warn(event));
        return;
      case LogLevel.error:
        prisma.$on(LogLevel.error, (event) => logger.error(event));
        return;
    }
  });
}

export function formatQueryEvent(
  maxStringLength: number = MAX_STRING_LENGTH,
  enableJsonParse: boolean = true,
  delimiter = '\n',
): (event: PrismaQueryEvent) => string {
  return (event: PrismaQueryEvent) => {
    const { query, params, duration } = event;
    return [
      'Query executed in ',
      Math.round(duration),
      ' ms:',
      delimiter,
      query,
      delimiter,
      'Params: ',
      formatParams(params, { maxStringLength, enableJsonParse }),
    ].join('');
  };
}

function formatParams(
  params: string,
  options: {
    maxStringLength?: number;
    enableJsonParse?: boolean;
  } = {},
): string {
  const { maxStringLength = MAX_STRING_LENGTH, enableJsonParse = true } =
    options;

  const parsedData = tryParseJSON(params, enableJsonParse);
  const finalString =
    typeof parsedData === 'string'
      ? parsedData
      : JSON.stringify(parsedData, null, 2);

  return truncateToMaxLength(finalString, maxStringLength);
}

function tryParseJSON(input: string, enableJsonParse: boolean) {
  if (!enableJsonParse) return input;

  try {
    return JSON.parse(input, truncateLongStrings);
  } catch {
    return input;
  }
}

function truncateLongStrings(_key: string, value: any) {
  if (typeof value === 'string' && value.length > 100) {
    return value.substring(0, 100) + TRUNCATED_STRING;
  }
  return value;
}

function truncateToMaxLength(value: string, maxLen: number): string {
  return value.length > maxLen
    ? value.substring(0, maxLen) + TRUNCATED_STRING
    : value;
}

/**
 * Returns a connect method that resolves only after the database answers a
 * real query. With driver adapters `$connect()` does not open a connection,
 * so readiness is `SELECT 1`. Temporary failures are retried without limit
 * (1000 ms × attempt + 0–500 ms jitter, capped at 30 s); fail-fast errors
 * (see isFailFastConnectionError) are rethrown immediately.
 */
function getConnectMethod(
  logger: ILoggerService,
  prisma: CustomPrismaClient,
): () => Promise<void> {
  return async function connect() {
    const baseDelay = 1000;
    const maxJitter = 500;
    const maxDelay = 30000;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    let attempt = 0;
    while (true) {
      try {
        logger.info('Connecting to the database...');
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        logger.info('Database connection established.');
        return;
      } catch (error) {
        if (isFailFastConnectionError(error)) {
          logger.error(
            `Failed to connect to the database (${describeConnectionError(error)}); not retrying.`,
          );
          throw error;
        }

        attempt++;
        logger.warn(
          `Attempt ${attempt} failed (${describeConnectionError(error)}): ${String((error as Error)?.message).trim()}`,
        );

        let backoffTime = baseDelay * attempt;
        const jitter = Math.floor(Math.random() * maxJitter);
        backoffTime += jitter;
        backoffTime = Math.min(backoffTime, maxDelay);
        logger.info(`Waiting for ${backoffTime} ms before next attempt.`);
        await delay(backoffTime);
      }
    }
  };
}

function getDisconnectMethod(
  logger: ILoggerService,
  prisma: CustomPrismaClient,
): () => Promise<void> {
  return async function disconnect() {
    try {
      await prisma.$disconnect();
      logger.info('Disconnected from the database.');
    } catch (error_) {
      const error = error_ as Error;
      logger.error(
        `Failed to disconnect from the database. Error: ${error.message}`,
      );
      throw error;
    }
  };
}

const DbUtils = {
  setupLogging,
  getConnectMethod,
  getDisconnectMethod,
  parseDatabaseUrl,
  buildSearchPathOption,
  getDriverAdapterErrorKind,
  isFailFastConnectionError,
};

export default DbUtils;
