import type { CustomPrismaClient, ILoggerService } from 'src/core/types';
import { DatabaseConfigurationError } from '../config/database-url';

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

/**
 * Returns a connect method that resolves only after the database answers a
 * real query. With driver adapters `$connect()` does not open a connection,
 * so readiness is `SELECT 1`. Temporary failures are retried without limit
 * (1000 ms × attempt + 0–500 ms jitter, capped at 30 s); fail-fast errors
 * (see isFailFastConnectionError) are rethrown immediately.
 */
export function getConnectMethod(
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

export function getDisconnectMethod(
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
