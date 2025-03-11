import { Environment } from 'src/core/constants';
import {
  AppConfigType,
  FormatQueryEventOptions,
  PrismaClientOptions,
  PrismaErrorFormat,
  PrismaLogLevels,
} from 'src/core/types';
import EnvironmentService from './environment.service';

export default class PrismaConfig {
  public readonly appEnv: Environment;
  public readonly logLevels: PrismaLogLevels;
  public readonly errorFormat: PrismaErrorFormat;
  public readonly prismaClientOptions: PrismaClientOptions;
  public readonly formatQueryEventOptions: FormatQueryEventOptions;

  constructor(private readonly environment: EnvironmentService) {
    const config = this.environment.getConfig();
    const isDevelopment = this.environment.isDevelopment();
    this.appEnv = config.appEnv;
    this.logLevels = this.getLogLevels(config);
    this.errorFormat = this.getErrorFormat(isDevelopment);
    this.prismaClientOptions = {
      log: this.logLevels.map((level) => ({
        emit: 'event',
        level,
      })),
      errorFormat: this.errorFormat,
    };
    this.formatQueryEventOptions = this.getFormatQueryEventOptions(config);
  }

  getLogLevels({
    appEnv,
    forcePrismaQueryLog,
  }: AppConfigType): PrismaLogLevels {
    const isDevelopment = appEnv === Environment.DEVELOPMENT;

    const baseLogLevels: PrismaLogLevels = ['info', 'warn', 'error'];

    if (isDevelopment || forcePrismaQueryLog) {
      return ['query', ...baseLogLevels];
    }

    return baseLogLevels;
  }

  getErrorFormat(isDevelopment: boolean): PrismaErrorFormat {
    return isDevelopment ? 'pretty' : 'minimal';
  }

  getFormatQueryEventOptions({
    forcePrismaQueryLog,
    prismaQueryMaxStrLen,
    prismaQueryEnableJsonParse,
    prismaQueryDelimiter,
  }: AppConfigType): FormatQueryEventOptions {
    const forceQueryLog = forcePrismaQueryLog;
    const maxStrLen = prismaQueryMaxStrLen;
    const enableJsonParse = prismaQueryEnableJsonParse;
    const delimiter = prismaQueryDelimiter;
    return {
      forceQueryLog,
      maxStrLen,
      enableJsonParse,
      delimiter,
    };
  }
}
