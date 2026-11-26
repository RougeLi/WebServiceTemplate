import fs from 'fs';
import os from 'os';
import path from 'path';
import { checkDatabaseTlsOptions } from 'src/core/config/postgres-options';
import { LoggerService } from 'src/core/services';
import {
  CustomPrismaClient,
  PrismaLogLevels,
  PrismaQueryEvent,
} from 'src/core/types';
import { Prisma } from 'src/generated/prisma/client';
import DbUtils, {
  DatabaseConfigurationError,
  formatQueryEvent,
  getDriverAdapterErrorKind,
  isFailFastConnectionError,
  parseDatabaseUrl,
} from '../db-utils';

/**
 * Builds an error shaped like the ones Prisma 7 + PrismaPg throw for
 * `$queryRaw` connection failures (code P2010, kind under
 * meta.driverAdapterError.cause).
 */
function driverAdapterError(
  kind: string,
  code = 'P2010',
  cause: Record<string, unknown> = {},
): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(`Raw query failed: ${kind}`, {
    code,
    clientVersion: '7.10.1',
    meta: { driverAdapterError: { cause: { kind, ...cause } } },
  });
}

describe('DbUtils', () => {
  let loggerMock: jest.Mocked<LoggerService>;
  let prismaMock: jest.Mocked<CustomPrismaClient>;

  const defaultFormatOptions = {
    forceQueryLog: false,
    maxStrLen: 1000,
    enableJsonParse: true,
    delimiter: '\n',
  };

  beforeEach(() => {
    loggerMock = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    prismaMock = {
      $on: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $queryRaw: jest.fn(),
    } as unknown as jest.Mocked<CustomPrismaClient>;
  });

  describe('setupLogging', () => {
    it('should setup query logging when log level includes "query"', () => {
      const logLevels: PrismaLogLevels = ['query'];
      DbUtils.setupLogging(
        loggerMock,
        logLevels,
        defaultFormatOptions,
        prismaMock,
      );
      expect(prismaMock.$on).toHaveBeenCalledWith(
        'query',
        expect.any(Function),
      );
    });

    it('should setup info logging when log level includes "info"', () => {
      const logLevels: PrismaLogLevels = ['info'];
      DbUtils.setupLogging(
        loggerMock,
        logLevels,
        defaultFormatOptions,
        prismaMock,
      );
      expect(prismaMock.$on).toHaveBeenCalledWith('info', expect.any(Function));
    });

    it('should setup warn logging when log level includes "warn"', () => {
      const logLevels: PrismaLogLevels = ['warn'];
      DbUtils.setupLogging(
        loggerMock,
        logLevels,
        defaultFormatOptions,
        prismaMock,
      );
      expect(prismaMock.$on).toHaveBeenCalledWith('warn', expect.any(Function));
    });

    it('should setup error logging when log level includes "error"', () => {
      const logLevels: PrismaLogLevels = ['error'];
      DbUtils.setupLogging(
        loggerMock,
        logLevels,
        defaultFormatOptions,
        prismaMock,
      );
      expect(prismaMock.$on).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
      );
    });

    it('should route info, warn and error events to the matching logger level', () => {
      DbUtils.setupLogging(
        loggerMock,
        ['info', 'warn', 'error'],
        defaultFormatOptions,
        prismaMock,
      );
      const callbackFor = (level: string) =>
        (prismaMock.$on as jest.Mock).mock.calls.find(
          (call) => call[0] === level,
        )?.[1];

      const event = { message: 'event message' };
      callbackFor('info')(event);
      callbackFor('warn')(event);
      callbackFor('error')(event);

      expect(loggerMock.info).toHaveBeenCalledWith(event);
      expect(loggerMock.warn).toHaveBeenCalledWith(event);
      expect(loggerMock.error).toHaveBeenCalledWith(event);
    });

    it('should use logger.info for query logging when forceQueryLog is true', () => {
      const logLevels: PrismaLogLevels = ['query'];
      const options = { ...defaultFormatOptions, forceQueryLog: true };
      DbUtils.setupLogging(loggerMock, logLevels, options, prismaMock);

      // Extract the registered callback for 'query'
      const queryCallback = (prismaMock.$on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'query',
      )?.[1];
      expect(queryCallback).toBeDefined();

      // Simulate a query event
      const event: PrismaQueryEvent = {
        timestamp: new Date(),
        query: 'SELECT * FROM users',
        params: JSON.stringify({ foo: 'bar' }),
        duration: 123,
        target: 'db',
      };
      queryCallback && queryCallback(event);
      // When forceQueryLog is true, the callback logs with logger.info
      expect(loggerMock.info).toHaveBeenCalled();
    });

    it('should use logger.debug for query logging when forceQueryLog is false', () => {
      const logLevels: PrismaLogLevels = ['query'];
      const options = { ...defaultFormatOptions, forceQueryLog: false };
      DbUtils.setupLogging(loggerMock, logLevels, options, prismaMock);

      // Extract the registered callback for 'query'
      const queryCallback = (prismaMock.$on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'query',
      )?.[1];
      expect(queryCallback).toBeDefined();

      // Simulate a query event
      const event: PrismaQueryEvent = {
        timestamp: new Date(),
        query: 'SELECT * FROM users',
        params: JSON.stringify({ foo: 'bar' }),
        duration: 123,
        target: 'db',
      };
      queryCallback && queryCallback(event);
      // When forceQueryLog is false, the callback logs with logger.debug
      expect(loggerMock.debug).toHaveBeenCalled();
    });
  });

  describe('formatQueryEvent', () => {
    const callFormat = (
      event: PrismaQueryEvent,
      maxStringLength = 1000,
      enableJsonParse = true,
    ): string => {
      const formatter = formatQueryEvent(maxStringLength, enableJsonParse);
      return formatter(event);
    };

    it('should format the query event with normal JSON string (enableJsonParse = true)', () => {
      const event: PrismaQueryEvent = {
        timestamp: new Date(),
        query: 'SELECT * FROM users',
        params: JSON.stringify({ foo: 'bar' }),
        duration: 123,
        target: 'db',
      };

      const result = callFormat(event);
      expect(result).toContain('Query executed in 123 ms:');
      expect(result).toContain('SELECT * FROM users');
      expect(result).toContain('Params:');
      expect(result).toContain('"foo": "bar"');
    });

    it('should round fractional durations reported by driver adapters to whole milliseconds', () => {
      const event: PrismaQueryEvent = {
        timestamp: new Date(),
        query: 'SELECT 1',
        params: '[]',
        duration: 2.9968441,
        target: 'ClientEngine',
      };

      expect(callFormat(event)).toContain('Query executed in 3 ms:');
      expect(callFormat({ ...event, duration: 0.31 })).toContain(
        'Query executed in 0 ms:',
      );
    });

    it('should format the query event with invalid JSON string (enableJsonParse = true)', () => {
      const event: PrismaQueryEvent = {
        timestamp: new Date(),
        query: 'UPDATE users',
        params: '{badJSON:',
        duration: 50,
        target: 'db',
      };

      const result = callFormat(event);
      expect(result).toContain('Query executed in 50 ms:');
      expect(result).toContain('UPDATE users');
      expect(result).toContain('Params: {badJSON:');
      expect(result).not.toContain('... (truncated)');
    });

    it('should format the query event without attempting JSON parse (enableJsonParse = false)', () => {
      const event: PrismaQueryEvent = {
        timestamp: new Date(),
        query: 'INSERT INTO table',
        params: '{"foo":"bar","baz":123}',
        duration: 10,
        target: 'db',
      };

      const result = callFormat(event, 1000, false);
      expect(result).toContain('Query executed in 10 ms:');
      expect(result).toContain('INSERT INTO table');
      expect(result).toContain('Params: {"foo":"bar","baz":123}');
    });

    it('should truncate very long JSON output when enableJsonParse = true', () => {
      const longStr = 'a'.repeat(1200);
      const event: PrismaQueryEvent = {
        timestamp: new Date(),
        query: 'SELECT big_column FROM table',
        params: JSON.stringify({ bigdata: longStr }),
        duration: 999,
        target: 'db',
      };

      const result = callFormat(event);
      expect(result).toContain('Query executed in 999 ms:');
      expect(result).toContain('SELECT big_column FROM table');
      expect(result).toContain('... (truncated)');
      expect(result.length).toBeLessThan(1200 + 100);
    });

    it('should truncate very long plain string when JSON parse fails or disabled', () => {
      const longStr = 'b'.repeat(1200);
      const event: PrismaQueryEvent = {
        timestamp: new Date(),
        query: 'DELETE FROM table',
        params: longStr,
        duration: 42,
        target: 'db',
      };

      const result = callFormat(event);
      expect(result).toContain('Query executed in 42 ms:');
      expect(result).toContain('DELETE FROM table');
      expect(result).toContain('... (truncated)');
    });
  });

  describe('parseDatabaseUrl', () => {
    const secret = 'S3cr3t-P@ss';
    const encodedSecret = encodeURIComponent(secret);

    it('should return the trimmed connection string for a postgresql:// URL', () => {
      const url = `postgresql://app:${encodedSecret}@db.example.com:5432/app_db`;
      expect(parseDatabaseUrl(`  ${url}\n`)).toEqual({
        connectionString: url,
        schema: undefined,
        ignoredParameters: [],
        optionsSearchPath: undefined,
      });
    });

    it('should accept the postgres:// scheme', () => {
      expect(
        parseDatabaseUrl('postgres://app@db.example.com/app_db')
          .connectionString,
      ).toBe('postgres://app@db.example.com/app_db');
    });

    it('should accept a host given as a query parameter (Unix socket)', () => {
      expect(() =>
        parseDatabaseUrl('postgresql:///app_db?host=/var/run/postgresql'),
      ).not.toThrow();
    });

    it('should return the schema parameter', () => {
      expect(
        parseDatabaseUrl('postgresql://app@db/app_db?schema=tenant_a').schema,
      ).toBe('tenant_a');
      expect(() =>
        parseDatabaseUrl('postgresql://app@db/app_db?schema='),
      ).toThrow(DatabaseConfigurationError);
      expect(
        parseDatabaseUrl('postgresql://app@db/app_db?schema=tenant%20').schema,
      ).toBe('tenant ');
      expect(
        parseDatabaseUrl(
          'postgresql://app@db/app_db?schema=a%2Fb&application_name=with space',
        ).schema,
      ).toBe('a/b');
    });

    it('should use the last schema parameter, as pg does for repeated parameters', () => {
      expect(
        parseDatabaseUrl('postgresql://app@db/app_db?schema=a&schema=b').schema,
      ).toBe('b');
    });

    it.each([
      ['-c search_path=tenant_a', 'tenant_a'],
      ['-csearch_path=tenant_a', 'tenant_a'],
      ['--search_path=tenant_a', 'tenant_a'],
      ['-c search_path=Tenant_A,public', 'tenant_a'],
      ['-c search_path="TenantA",public', 'TenantA'],
      ['-c search_path="Tenant\\ A"', 'Tenant A'],
      ['-c search_path=a -c statement_timeout=5 -c search_path=b', 'b'],
      ['-c statement_timeout=5000', undefined],
    ])(
      'should read the search_path that pg options %p sets',
      (options, expected) => {
        expect(
          parseDatabaseUrl(
            `postgresql://app@db/app_db?options=${encodeURIComponent(options)}`,
          ).optionsSearchPath,
        ).toBe(expected);
      },
    );

    it('should read the last options parameter, which is the one pg sends', () => {
      expect(
        parseDatabaseUrl(
          `postgresql://app@db/app_db?options=${encodeURIComponent('-c search_path=a')}&options=${encodeURIComponent('-c statement_timeout=5')}`,
        ).optionsSearchPath,
      ).toBeUndefined();
    });

    it('should validate the effective host when the URL has no hostname', () => {
      expect(() =>
        parseDatabaseUrl('postgresql:///fixture?host=db&host='),
      ).toThrow(DatabaseConfigurationError);
      expect(() =>
        parseDatabaseUrl('postgresql:///fixture?host=&host=/tmp/fixture'),
      ).not.toThrow();
    });

    it.each([
      'postgresql://user:p%80@db/test',
      'postgresql://%80@db/test',
      'postgresql://db/%80',
    ])('should reject invalid UTF-8 before pg decodes a target', (url) => {
      expect(() => parseDatabaseUrl(url)).toThrow(
        'DATABASE_URL is not a valid URL.',
      );
    });

    describe('certificate parameters', () => {
      let directory: string;
      let certificate: string;

      beforeAll(() => {
        directory = fs.mkdtempSync(path.join(os.tmpdir(), 'db-utils-spec-'));
        certificate = path.join(directory, 'ca.pem');
        fs.writeFileSync(certificate, 'test');
      });

      afterAll(() => {
        fs.rmSync(directory, { recursive: true, force: true });
      });

      it('should reject deterministic pg TLS configuration errors before connecting', () => {
        const target = 'postgresql://app@db/app_db?';
        expect(() =>
          checkDatabaseTlsOptions(
            target + 'sslmode=verify-ca&uselibpqcompat=true',
          ),
        ).toThrow(/requires sslrootcert/);
        expect(() =>
          checkDatabaseTlsOptions(
            target +
              'sslmode=verify-ca&uselibpqcompat=true&sslrootcert=' +
              encodeURIComponent(certificate),
          ),
        ).not.toThrow();
        expect(() =>
          checkDatabaseTlsOptions(target + 'sslmode=verify-ca'),
        ).not.toThrow();
        expect(() =>
          checkDatabaseTlsOptions(
            target + 'sslmode=disable&sslnegotiation=direct',
          ),
        ).toThrow(/requires TLS/);
        expect(() =>
          checkDatabaseTlsOptions(target + 'sslnegotiation=invalid'),
        ).toThrow(/postgres or direct/);
      });

      it('should validate the client key before pg opens a TLS socket', () => {
        const url =
          'postgresql://app@db/app_db?sslkey=' +
          encodeURIComponent(certificate);
        expect(() => checkDatabaseTlsOptions(url)).toThrow(
          DatabaseConfigurationError,
        );
        expect(() =>
          checkDatabaseTlsOptions(url + '&sslmode=disable'),
        ).not.toThrow();
      });

      it('should accept readable certificate files', () => {
        expect(() =>
          checkDatabaseTlsOptions(
            `postgresql://app@db/app_db?sslmode=verify-full&sslrootcert=${encodeURIComponent(certificate)}`,
          ),
        ).not.toThrow();
      });

      it('should check the last certificate parameter, which is the one pg reads', () => {
        expect(() =>
          checkDatabaseTlsOptions(
            `postgresql://app@db/app_db?sslrootcert=${encodeURIComponent(certificate)}&sslrootcert=${encodeURIComponent(path.join(directory, 'missing.pem'))}`,
          ),
        ).toThrow(
          'DATABASE_URL sslrootcert does not point to a readable file.',
        );
      });

      it('should check the path pg reads when it re-encodes a URL with spaces', () => {
        // pg-connection-string re-encodes the whole URL when it contains a
        // space, so %2F in the path is read literally and the file is missing.
        expect(() =>
          checkDatabaseTlsOptions(
            `postgresql://app@db/app_db?application_name=a b&sslrootcert=${encodeURIComponent(certificate)}`,
          ),
        ).toThrow(DatabaseConfigurationError);
        expect(() =>
          checkDatabaseTlsOptions(
            `postgresql://app@db/app_db?application_name=a b&sslrootcert=${certificate}`,
          ),
        ).not.toThrow();
      });

      it.each(['sslrootcert', 'sslcert', 'sslkey'])(
        'should reject a %s that is not a readable file without echoing the path',
        (name) => {
          const missing = path.join(directory, 'missing-secret.pem');
          for (const value of [missing, directory]) {
            let thrown: unknown;
            try {
              checkDatabaseTlsOptions(
                `postgresql://app@db/app_db?${name}=${encodeURIComponent(value)}`,
              );
            } catch (error) {
              thrown = error;
            }
            expect(thrown).toBeInstanceOf(DatabaseConfigurationError);
            expect((thrown as Error).message).toBe(
              `DATABASE_URL ${name} does not point to a readable file.`,
            );
            expect((thrown as Error).message).not.toContain('missing-secret');
          }
        },
      );
    });

    it('should list Prisma 6 parameters that the pg driver ignores', () => {
      const { ignoredParameters } = parseDatabaseUrl(
        'postgresql://app@db/app_db?connection_limit=1&pool_timeout=5&schema=public&sslmode=require&application_name=svc&pgbouncer=true',
      );
      expect(ignoredParameters).toEqual([
        'connection_limit',
        'pool_timeout',
        'pgbouncer',
      ]);
    });

    it.each([
      ['undefined', undefined, 'DATABASE_URL is not set or empty.'],
      ['an empty string', '', 'DATABASE_URL is not set or empty.'],
      ['whitespace only', '   \t', 'DATABASE_URL is not set or empty.'],
      ['not a URL', 'not-a-url', 'DATABASE_URL is not a valid URL.'],
      [
        'another scheme',
        `mysql://app:${encodedSecret}@db/app_db`,
        'DATABASE_URL must use the postgresql:// or postgres:// scheme.',
      ],
      [
        'credentials without a host',
        `postgresql://app:${encodedSecret}@/app_db`,
        'DATABASE_URL is not a valid URL.',
      ],
      [
        'a path without a host',
        'postgresql:///app_db',
        'DATABASE_URL must include a host.',
      ],
      ['a scheme only', 'postgresql://', 'DATABASE_URL must include a host.'],
    ])(
      'should reject %s with a DatabaseConfigurationError that hides the URL',
      (_label, value, message) => {
        let thrown: unknown;
        try {
          parseDatabaseUrl(value);
        } catch (error) {
          thrown = error;
        }
        expect(thrown).toBeInstanceOf(DatabaseConfigurationError);
        const error = thrown as DatabaseConfigurationError;
        expect(error.name).toBe('DatabaseConfigurationError');
        expect(error.message).toBe(message);
        expect(error.message).not.toContain(secret);
        expect(error.message).not.toContain(encodedSecret);
        expect(error.cause).toBeUndefined();
      },
    );
  });

  describe('getDriverAdapterErrorKind', () => {
    it('should read meta.driverAdapterError.cause.kind', () => {
      expect(
        getDriverAdapterErrorKind(driverAdapterError('AuthenticationFailed')),
      ).toBe('AuthenticationFailed');
    });

    it.each([
      ['a plain Error', new Error('Connection terminated')],
      ['null', null],
      ['a string', 'boom'],
      ['an error without cause', { meta: { driverAdapterError: {} } }],
      [
        'a non-string kind',
        { meta: { driverAdapterError: { cause: { kind: 42 } } } },
      ],
    ])('should return undefined for %s', (_label, error) => {
      expect(getDriverAdapterErrorKind(error)).toBeUndefined();
    });
  });

  describe('isFailFastConnectionError', () => {
    it('should recognize local OpenSSL key errors without a driver kind', () => {
      const error = Object.assign(new Error('could not decode the test key'), {
        code: 'ERR_OSSL_UNSUPPORTED',
      });
      expect(isFailFastConnectionError(error)).toBe(true);
      expect(
        isFailFastConnectionError(
          Object.assign(new Error('socket closed'), { code: 'ECONNRESET' }),
        ),
      ).toBe(false);
    });

    it.each([
      'AuthenticationFailed',
      'DatabaseDoesNotExist',
      'DatabaseAccessDenied',
      'TlsConnectionError',
    ])('should fail fast on %s', (kind) => {
      expect(isFailFastConnectionError(driverAdapterError(kind))).toBe(true);
      expect(isFailFastConnectionError(driverAdapterError(kind, 'P1000'))).toBe(
        true,
      );
    });

    it.each([
      'DatabaseNotReachable',
      'SocketTimeout',
      'ConnectionClosed',
      'TooManyConnections',
      'postgres',
    ])('should retry on %s', (kind) => {
      expect(isFailFastConnectionError(driverAdapterError(kind))).toBe(false);
    });

    it('should fail fast when the CONNECT privilege is revoked (postgres 42501)', () => {
      expect(
        isFailFastConnectionError(
          driverAdapterError('postgres', 'P2010', { code: '42501' }),
        ),
      ).toBe(true);
      expect(
        isFailFastConnectionError(
          driverAdapterError('postgres', 'P2010', { code: '57P03' }),
        ),
      ).toBe(false);
    });

    it('should fail fast on configuration errors', () => {
      expect(
        isFailFastConnectionError(new DatabaseConfigurationError('invalid')),
      ).toBe(true);
    });

    it('should fail fast when pg reports a missing password', () => {
      expect(
        isFailFastConnectionError(
          new Error(
            'SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string',
          ),
        ),
      ).toBe(true);
    });

    it('should retry on plain errors such as the pg connection timeout', () => {
      expect(
        isFailFastConnectionError(
          new Error('Connection terminated due to connection timeout'),
        ),
      ).toBe(false);
      expect(
        isFailFastConnectionError(
          new Error('timeout exceeded when trying to connect'),
        ),
      ).toBe(false);
      expect(isFailFastConnectionError('not an error')).toBe(false);
    });

    it('should not use Prisma error codes or message text for classification', () => {
      const authLikeMessage = new Prisma.PrismaClientKnownRequestError(
        'Authentication failed against the database server',
        { code: 'P1000', clientVersion: '7.10.1' },
      );
      expect(isFailFastConnectionError(authLikeMessage)).toBe(false);
    });
  });

  describe('getConnectMethod', () => {
    let connectMethod: () => Promise<void>;

    beforeEach(() => {
      connectMethod = DbUtils.getConnectMethod(loggerMock, prismaMock);
      jest.useFakeTimers();
      jest.spyOn(global, 'setTimeout');
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
      jest.clearAllMocks();
    });

    it('should be ready only after SELECT 1 succeeds', async () => {
      prismaMock.$connect.mockResolvedValueOnce(undefined);
      prismaMock.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      await connectMethod();

      expect(loggerMock.info).toHaveBeenCalledWith(
        'Connecting to the database...',
      );
      expect(prismaMock.$connect).toHaveBeenCalledTimes(1);
      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
      const [strings] = prismaMock.$queryRaw.mock.calls[0];
      expect(strings.join('')).toBe('SELECT 1');
      expect(prismaMock.$queryRaw.mock.invocationCallOrder[0]).toBeGreaterThan(
        prismaMock.$connect.mock.invocationCallOrder[0],
      );
      expect(loggerMock.info).toHaveBeenCalledWith(
        'Database connection established.',
      );
    });

    it('should not treat a resolved $connect() as ready when the query fails', async () => {
      prismaMock.$connect.mockResolvedValue(undefined);
      prismaMock.$queryRaw
        .mockRejectedValueOnce(driverAdapterError('DatabaseNotReachable'))
        .mockResolvedValueOnce([{ '?column?': 1 }]);

      const connectPromise = connectMethod();
      await jest.advanceTimersByTimeAsync(0);

      expect(loggerMock.info).not.toHaveBeenCalledWith(
        'Database connection established.',
      );

      await jest.runOnlyPendingTimersAsync();
      await connectPromise;

      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(2);
      expect(loggerMock.info).toHaveBeenCalledWith(
        'Database connection established.',
      );
    });

    it('should retry on failure and eventually succeed', async () => {
      prismaMock.$connect.mockResolvedValue(undefined);
      prismaMock.$queryRaw
        .mockRejectedValueOnce(new Error('Connection error #1'))
        .mockResolvedValueOnce([{ '?column?': 1 }]);

      const connectPromise = connectMethod();
      await jest.runOnlyPendingTimersAsync();
      await connectPromise;

      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(2);
      expect(loggerMock.info).toHaveBeenCalledWith(
        'Connecting to the database...',
      );
      expect(loggerMock.warn).toHaveBeenCalledWith(
        'Attempt 1 failed (Error): Connection error #1',
      );
      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringMatching(/Waiting for \d+ ms before next attempt./),
      );
      expect(loggerMock.info).toHaveBeenCalledWith(
        'Database connection established.',
      );
    });

    it.each([
      'DatabaseNotReachable',
      'SocketTimeout',
      'ConnectionClosed',
      'TooManyConnections',
    ])('should retry when the driver adapter reports %s', async (kind) => {
      prismaMock.$connect.mockResolvedValue(undefined);
      prismaMock.$queryRaw
        .mockRejectedValueOnce(driverAdapterError(kind))
        .mockResolvedValueOnce([{ '?column?': 1 }]);

      const connectPromise = connectMethod();
      await jest.runOnlyPendingTimersAsync();
      await connectPromise;

      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(2);
      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining(`Attempt 1 failed (${kind})`),
      );
    });

    it('should back off by 1000 ms × attempt plus jitter, capped at 30 s', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.999);
      prismaMock.$connect.mockResolvedValue(undefined);
      for (let i = 0; i < 31; i++) {
        prismaMock.$queryRaw.mockRejectedValueOnce(
          driverAdapterError('DatabaseNotReachable'),
        );
      }
      prismaMock.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      const connectPromise = connectMethod();
      for (let i = 0; i < 31; i++) {
        await jest.runOnlyPendingTimersAsync();
      }
      await connectPromise;

      const delays = (setTimeout as unknown as jest.Mock).mock.calls.map(
        (call) => call[1],
      );
      expect(delays.slice(0, 3)).toEqual([1499, 2499, 3499]);
      expect(delays[28]).toBe(29499);
      expect(delays[29]).toBe(30000);
      expect(delays[30]).toBe(30000);
      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(32);
    });

    it.each([
      'AuthenticationFailed',
      'DatabaseDoesNotExist',
      'DatabaseAccessDenied',
      'TlsConnectionError',
    ])('should throw without retrying on %s', async (kind) => {
      const error = driverAdapterError(kind);
      prismaMock.$connect.mockResolvedValueOnce(undefined);
      prismaMock.$queryRaw.mockRejectedValueOnce(error);

      await expect(connectMethod()).rejects.toBe(error);
      expect(loggerMock.error).toHaveBeenCalledWith(
        `Failed to connect to the database (${kind}); not retrying.`,
      );
      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
      expect(setTimeout).not.toHaveBeenCalled();
    });

    it('should throw without retrying when CONNECT is revoked (postgres 42501)', async () => {
      const error = driverAdapterError('postgres', 'P2010', { code: '42501' });
      prismaMock.$connect.mockResolvedValueOnce(undefined);
      prismaMock.$queryRaw.mockRejectedValueOnce(error);

      await expect(connectMethod()).rejects.toBe(error);
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Failed to connect to the database (postgres 42501); not retrying.',
      );
      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should throw without retrying when the password is missing', async () => {
      const error = new Error(
        'SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string',
      );
      prismaMock.$connect.mockResolvedValueOnce(undefined);
      prismaMock.$queryRaw.mockRejectedValueOnce(error);

      await expect(connectMethod()).rejects.toBe(error);
      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
      expect(setTimeout).not.toHaveBeenCalled();
    });

    it('should throw without retrying on configuration errors', async () => {
      const error = new DatabaseConfigurationError('invalid');
      prismaMock.$connect.mockRejectedValueOnce(error);

      await expect(connectMethod()).rejects.toBe(error);
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Failed to connect to the database (DatabaseConfigurationError); not retrying.',
      );
      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('getDisconnectMethod', () => {
    let disconnectMethod: () => Promise<void>;

    beforeEach(() => {
      disconnectMethod = DbUtils.getDisconnectMethod(loggerMock, prismaMock);
    });

    it('should disconnect from the database successfully', async () => {
      prismaMock.$disconnect.mockResolvedValueOnce(undefined);

      await disconnectMethod();

      expect(prismaMock.$disconnect).toHaveBeenCalled();
      expect(loggerMock.info).toHaveBeenCalledWith(
        'Disconnected from the database.',
      );
    });

    it('should log error if disconnect fails', async () => {
      const disconnectError = new Error('Disconnect failed');
      prismaMock.$disconnect.mockRejectedValueOnce(disconnectError);

      await expect(disconnectMethod()).rejects.toThrow('Disconnect failed');
      expect(loggerMock.error).toHaveBeenCalledWith(
        `Failed to disconnect from the database. Error: ${disconnectError.message}`,
      );
    });
  });
});
