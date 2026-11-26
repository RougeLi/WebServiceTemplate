import fs from 'node:fs';
import { createSecureContext, type SecureContextOptions } from 'node:tls';
import type { ParsedDatabaseUrl } from 'src/core/types';
import {
  DatabaseConfigurationError,
  getLastSearchParam,
  parseDatabaseTarget,
} from './database-url';

/** URL parameters that pg reads as file paths (relative to the cwd). */
const CERTIFICATE_URL_PARAMETERS = ['sslrootcert', 'sslcert', 'sslkey'];

/**
 * Returns the first schema of a `search_path` set in a pg `options` string
 * (`-c search_path=...` or `--search_path=...`; the last setting wins).
 * Quoted identifiers keep their case; unquoted ones are lower-cased as
 * PostgreSQL does.
 */
function getOptionsSearchPath(options: string | undefined): string | undefined {
  if (!options) {
    return undefined;
  }
  const settings = [
    ...options.matchAll(/(?:^|\s)(?:-c\s*|--)search_path=((?:\\.|[^\s\\])*)/gi),
  ];
  const value = settings.at(-1)?.[1].replaceAll(/\\(.)/g, '$1');
  const first = value?.split(',')[0].trim();
  if (!first) {
    return undefined;
  }
  return /^".*"$/.test(first)
    ? first.slice(1, -1).replaceAll('""', '"')
    : first.toLowerCase();
}

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

/** Extracts adapter options without opening the database or certificate files. */
export function parseDatabaseUrl(
  databaseUrl: string | undefined,
): ParsedDatabaseUrl {
  const { connectionString, url, schema } = parseDatabaseTarget(databaseUrl);
  const ignoredParameters = IGNORED_PRISMA6_URL_PARAMETERS.filter((name) =>
    url.searchParams.has(name),
  );

  return {
    connectionString,
    schema,
    ignoredParameters,
    optionsSearchPath: getOptionsSearchPath(getLastSearchParam(url, 'options')),
  };
}

/** Checks pg TLS options and files at the explicit connection boundary. */
export function checkDatabaseTlsOptions(connectionString: string): void {
  const { url } = parseDatabaseTarget(connectionString);
  const mode = getLastSearchParam(url, 'sslmode');
  const negotiation = getLastSearchParam(url, 'sslnegotiation');
  const ssl = getLastSearchParam(url, 'ssl');
  if (negotiation && !['postgres', 'direct'].includes(negotiation)) {
    throw new DatabaseConfigurationError(
      'DATABASE_URL sslnegotiation must be postgres or direct.',
    );
  }
  if (
    negotiation === 'direct' &&
    (mode === 'disable' ||
      (!mode &&
        ssl === '0' &&
        !CERTIFICATE_URL_PARAMETERS.some((name) =>
          getLastSearchParam(url, name),
        )))
  ) {
    throw new DatabaseConfigurationError(
      'DATABASE_URL direct SSL negotiation requires TLS.',
    );
  }
  if (
    mode === 'verify-ca' &&
    getLastSearchParam(url, 'uselibpqcompat') === 'true' &&
    !getLastSearchParam(url, 'sslrootcert')
  ) {
    throw new DatabaseConfigurationError(
      'DATABASE_URL sslmode=verify-ca with libpq compatibility requires sslrootcert.',
    );
  }
  // pg reads the files even when TLS is disabled. If TLS is enabled, check
  // client key material before pg opens its socket for the SSL handshake.
  const context: SecureContextOptions = {};
  for (const name of CERTIFICATE_URL_PARAMETERS) {
    const path = getLastSearchParam(url, name);
    if (!path) {
      continue;
    }
    if (!isReadableFile(path)) {
      throw new DatabaseConfigurationError(
        `DATABASE_URL ${name} does not point to a readable file.`,
      );
    }
    if (mode !== 'disable' && (name === 'sslcert' || name === 'sslkey')) {
      const key = name === 'sslcert' ? 'cert' : 'key';
      context[key] = fs.readFileSync(path);
    }
  }

  if (context.key || context.cert) {
    try {
      createSecureContext(context);
    } catch (cause) {
      throw new DatabaseConfigurationError(
        'Invalid PostgreSQL client TLS certificate or private key.',
        { cause },
      );
    }
  }
}

function isReadableFile(path: string): boolean {
  try {
    fs.accessSync(path, fs.constants.R_OK);
    return fs.statSync(path).isFile();
  } catch {
    return false;
  }
}
