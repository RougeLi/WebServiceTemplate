import {
  CustomPrismaClient,
  FormatQueryEventOptions,
  ILoggerService,
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
      duration,
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
        logger.info('Database connection established.');
        return;
      } catch (error) {
        if (isAuthenticationError(error)) {
          logger.error(
            'Failed to connect to the database due to authentication error.',
          );
          throw error;
        }

        attempt++;
        logger.warn(`Attempt ${attempt} failed: ${(error as Error).message}`);

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

function isAuthenticationError(error: any): boolean {
  return error.code === 'P1000' || error.message.includes('Authentication');
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
};

export default DbUtils;
