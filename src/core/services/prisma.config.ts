import { Environment } from 'src/core/constants';
import { EnvironmentService } from 'src/core/services';
import {
  PrismaClientOptions,
  PrismaErrorFormat,
  PrismaLogLevels,
} from 'src/core/types';

export default class PrismaConfig {
  public readonly appEnv: Environment;
  public readonly logLevels: PrismaLogLevels;
  public readonly errorFormat: PrismaErrorFormat;
  public readonly prismaClientOptions: PrismaClientOptions;

  constructor(private readonly environment: EnvironmentService) {
    this.appEnv = environment.getAppEnv();
    this.logLevels = this.getLogLevels(this.appEnv);
    this.errorFormat = this.getErrorFormat(this.environment.isDevelopment());
    this.prismaClientOptions = {
      log: this.logLevels.map((level) => ({
        emit: 'event',
        level,
      })),
      errorFormat: this.errorFormat,
    };
  }

  getLogLevels(appEnv: string): PrismaLogLevels {
    return appEnv === Environment.DEVELOPMENT
      ? ['query', 'info', 'warn', 'error']
      : ['info', 'warn', 'error'];
  }

  getErrorFormat(isDevelopment: boolean): PrismaErrorFormat {
    return isDevelopment ? 'pretty' : 'minimal';
  }
}
