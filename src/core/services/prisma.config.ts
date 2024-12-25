import { Environment } from 'src/core/constants';
import {
  AppConfigType,
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

  constructor(private readonly environment: EnvironmentService) {
    this.appEnv = environment.getAppEnv();
    this.logLevels = this.getLogLevels(this.environment.getConfig());
    this.errorFormat = this.getErrorFormat(this.environment.isDevelopment());
    this.prismaClientOptions = {
      log: this.logLevels.map((level) => ({
        emit: 'event',
        level,
      })),
      errorFormat: this.errorFormat,
    };
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
}
