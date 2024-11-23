import { PrismaClient } from '@prisma/client';
import { LoggerService } from 'src/core/services';
import { PrismaConfigService } from 'src/core/services';
import {
  CustomPrismaClient,
  IDBService,
  PrismaLogLevels,
  PrismaQueryEvent,
} from 'src/core/types';

export default class PrismaService extends PrismaClient implements IDBService {
  protected readonly MAX_STRING_LENGTH = 1000;

  constructor(
    private readonly logger: LoggerService,
    readonly prismaConfig: PrismaConfigService,
  ) {
    super(prismaConfig.prismaClientOptions);
    this.setupLogging(prismaConfig.logLevels, this);
  }

  async connect(): Promise<void> {
    const baseDelay = 1000;
    const maxJitter = 500;
    const maxDelay = 30000;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    let attempt = 0;
    while (true) {
      try {
        this.logger.info('Connecting to the database...');
        await this.$connect();
        this.logger.info('Database connection established.');
        return;
      } catch (error) {
        if (this.isAuthenticationError(error)) {
          this.logger.error(
            'Failed to connect to the database due to authentication error.',
          );
          throw error;
        }

        attempt++;
        this.logger.warn(
          `Attempt ${attempt} failed: ${(error as Error).message}`,
        );

        let backoffTime = baseDelay * attempt;
        const jitter = Math.floor(Math.random() * maxJitter);
        backoffTime += jitter;
        backoffTime = Math.min(backoffTime, maxDelay);
        this.logger.info(`Waiting for ${backoffTime} ms before next attempt.`);
        await delay(backoffTime);
      }
    }
  }

  isAuthenticationError(error: any): boolean {
    return error.code === 'P1000' || error.message.includes('Authentication');
  }

  async disconnect(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.info('Disconnected from the database.');
    } catch (error_) {
      const error = error_ as Error;
      this.logger.error(
        `Failed to disconnect from the database. Error: ${error.message}`,
      );
      throw error;
    }
  }

  setupLogging(logLevels: PrismaLogLevels, prisma: CustomPrismaClient): void {
    logLevels.forEach((level) => {
      switch (level) {
        case 'query':
          prisma.$on('query', (event) =>
            this.logger.debug(this.outputQueryEventMessage(event)),
          );
          return;
        case 'info':
          prisma.$on('info', (event) => this.logger.info(event.message));
          return;
        case 'warn':
          prisma.$on('warn', (event) => this.logger.warn(event.message));
          return;
        case 'error':
          prisma.$on('error', (event) => this.logger.error(event.message));
          return;
      }
    });
  }

  outputQueryEventMessage(event: PrismaQueryEvent): string {
    const { query, params, duration } = event;
    const formattedParams = this.formatParams(params);
    return `Query executed in ${duration} ms:\n${query}\nParams:\n${formattedParams}\n---`;
  }

  formatParams(params: string): string {
    try {
      const parsedParams = JSON.parse(
        params,
        PrismaService.truncateLongStrings,
      );
      const formatted = JSON.stringify(parsedParams, null, 2);
      return formatted.length > this.MAX_STRING_LENGTH
        ? formatted.substring(0, this.MAX_STRING_LENGTH) + '... (truncated)'
        : formatted;
    } catch {
      return params.length > this.MAX_STRING_LENGTH
        ? params.substring(0, this.MAX_STRING_LENGTH) + '... (truncated)'
        : params;
    }
  }

  static truncateLongStrings(_key: string, value: any) {
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '... (truncated)';
    }
    return value;
  }
}
