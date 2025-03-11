export type LogLevel = 'info' | 'query' | 'warn' | 'error';

export type PrismaLogLevels = LogLevel[];

export type PrismaQueryEvent = {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
};

export type PrismaErrorFormat = 'pretty' | 'colorless' | 'minimal';

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
};

export type FormatQueryEventOptions = {
  forceQueryLog?: boolean;
  maxStrLen?: number;
  enableJsonParse?: boolean;
  delimiter?: string;
};
