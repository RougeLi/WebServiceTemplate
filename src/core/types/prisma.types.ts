import { Prisma, PrismaClient } from '@prisma/client';

export type CustomPrismaClient = PrismaClient<CustomPrismaClientOptions>;

export type PrismaLogLevels = Prisma.LogLevel[];

export type PrismaQueryEvent = Prisma.QueryEvent;

export type PrismaErrorFormat = Prisma.ErrorFormat;

export type PrismaClientOptions = Prisma.PrismaClientOptions;

interface CustomPrismaClientOptions extends Prisma.PrismaClientOptions {
  log: Array<{ level: Prisma.LogLevel; emit: 'event' }>;
}
