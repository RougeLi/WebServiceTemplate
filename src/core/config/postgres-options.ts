import fs from 'node:fs';
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
  const { connectionString, url } = parseDatabaseTarget(databaseUrl);
  const schema = getLastSearchParam(url, 'schema')?.trim() || undefined;
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

/** Checks the files pg will read, at the explicit connection boundary. */
export function checkDatabaseCertificateFiles(connectionString: string): void {
  const { url } = parseDatabaseTarget(connectionString);
  // pg reads these files while connecting and would fail every retry with
  // ENOENT, an error without a driver adapter kind; reject them up front.
  for (const name of CERTIFICATE_URL_PARAMETERS) {
    const path = getLastSearchParam(url, name);
    if (path && !isReadableFile(path)) {
      throw new DatabaseConfigurationError(
        `DATABASE_URL ${name} does not point to a readable file.`,
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
