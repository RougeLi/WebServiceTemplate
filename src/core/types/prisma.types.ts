export type LogLevel = 'info' | 'query' | 'warn' | 'error';

export type PrismaLogLevels = LogLevel[];

export type PrismaQueryEvent = {
  timestamp: Date;
  query: string;
  params: string;
  /**
   * Query duration in milliseconds. With Prisma 7 driver adapters this is a
   * floating-point value (Prisma 6 reported whole milliseconds).
   */
  duration: number;
  target: string;
};

export type PrismaErrorFormat = 'pretty' | 'colorless' | 'minimal';

/**
 * Logging and error-format options shared by every Prisma Client instance.
 * The driver adapter is added by PrismaService when the Client is created.
 */
export type PrismaClientOptions = {
  log: Array<{ emit: 'event'; level: LogLevel }>;
  errorFormat: PrismaErrorFormat;
};

export type CustomPrismaClient = {
  $on<V extends 'query' | 'info' | 'warn' | 'error'>(
    eventType: V,
    callback: (
      event: V extends 'query' ? PrismaQueryEvent : { message: string },
    ) => void,
  ): void;
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $queryRaw<T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): PromiseLike<T>;
};

export type FormatQueryEventOptions = {
  forceQueryLog?: boolean;
  maxStrLen?: number;
  enableJsonParse?: boolean;
  delimiter?: string;
};

/**
 * Result of validating DATABASE_URL. Never log `connectionString`: it may
 * contain credentials.
 */
export type ParsedDatabaseUrl = {
  connectionString: string;
  /** Value of the `?schema=` parameter, if any. */
  schema?: string;
  /** Prisma 6 URL parameters that the pg driver does not apply. */
  ignoredParameters: string[];
};

/**
 * Pool configuration passed to `PrismaPg`. The adapter creates and owns the
 * pg pool; `$disconnect()` closes it.
 */
export type PrismaPgPoolConfig = {
  connectionString: string;
  max: number;
  connectionTimeoutMillis: number;
};

export type PrismaPgAdapterOptions = {
  schema?: string;
};

export type DatabaseConnectionOptions = {
  poolConfig: PrismaPgPoolConfig;
  adapterOptions: PrismaPgAdapterOptions;
  ignoredUrlParameters: string[];
};
