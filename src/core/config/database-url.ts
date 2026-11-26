const SUPPORTED_DATABASE_URL_PROTOCOLS = new Set(['postgres:', 'postgresql:']);

/**
 * pg-connection-string re-encodes the whole URL with `encodeURI` when it
 * contains a space or a malformed percent escape. The template parses the URL
 * the same way so its checks see the values pg will use.
 */
const PG_REENCODE_TRIGGER = / |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i;

function toPgParseInput(connectionString: string): string {
  return PG_REENCODE_TRIGGER.test(connectionString)
    ? encodeURI(connectionString).replaceAll(/%25(\d\d)/g, '%$1')
    : connectionString;
}

/** pg keeps the last value of a repeated query parameter. */
export function getLastSearchParam(url: URL, name: string): string | undefined {
  return url.searchParams.getAll(name).at(-1);
}

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
export function parseDatabaseTarget(databaseUrl: string | undefined): {
  connectionString: string;
  url: URL;
} {
  const connectionString = databaseUrl?.trim();
  if (!connectionString) {
    throw new DatabaseConfigurationError('DATABASE_URL is not set or empty.');
  }

  let url: URL;
  try {
    url = new URL(toPgParseInput(connectionString));
    // WHATWG URL accepts malformed UTF-8 escapes that pg later decodes.
    // Query parameters override the matching authority components in pg.
    for (const [name, component] of [
      ['user', url.username],
      ['password', url.password],
      ['host', url.hostname],
    ]) {
      if (!getLastSearchParam(url, name)) {
        decodeURIComponent(component);
      }
    }
    decodeURI(url.pathname);
  } catch {
    throw new DatabaseConfigurationError('DATABASE_URL is not a valid URL.');
  }

  if (!SUPPORTED_DATABASE_URL_PROTOCOLS.has(url.protocol)) {
    throw new DatabaseConfigurationError(
      'DATABASE_URL must use the postgresql:// or postgres:// scheme.',
    );
  }

  if (!url.hostname && !getLastSearchParam(url, 'host')) {
    throw new DatabaseConfigurationError('DATABASE_URL must include a host.');
  }

  return { connectionString, url };
}
