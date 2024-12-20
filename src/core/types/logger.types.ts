export interface ILoggerService {
  trace(...argumentsArray: any[]): void;

  debug(...argumentsArray: any[]): void;

  info(...argumentsArray: any[]): void;

  warn(...argumentsArray: any[]): void;

  error(...argumentsArray: any[]): void;

  fatal(...argumentsArray: any[]): void;
}
