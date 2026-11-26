import { parseDatabaseUrl } from '../config/postgres-options';
import {
  getConnectMethod,
  getDisconnectMethod,
  getDriverAdapterErrorKind,
  isFailFastConnectionError,
} from '../services/prisma-connection';
import { setupLogging } from '../services/prisma-query-log';

export { DatabaseConfigurationError } from '../config/database-url';
export {
  parseDatabaseUrl,
  getDriverAdapterErrorKind,
  isFailFastConnectionError,
};
export { formatQueryEvent } from '../services/prisma-query-log';

/** Existing utility entry point for consumers of the template. */
export default {
  setupLogging,
  getConnectMethod,
  getDisconnectMethod,
  parseDatabaseUrl,
  getDriverAdapterErrorKind,
  isFailFastConnectionError,
};
