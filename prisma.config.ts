import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { parseDatabaseTarget } from './src/core/config/database-url';

/**
 * Prisma CLI configuration (generate / migrate / seed).
 *
 * - Loads `.env` with dotenv; variables already set in the environment win.
 * - `DATABASE_URL` is read from `process.env` instead of `env()` from
 *   `prisma/config`, so `prisma generate` keeps working without a database.
 *   Commands that need a database fail with "The datasource.url property is
 *   required" when the URL is missing or blank.
 * - This file is for the CLI only. The application never imports it; the
 *   runtime connection is configured by `src/core/services/prisma.config.ts`.
 */
const databaseUrl = process.env.DATABASE_URL?.trim();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  ...(databaseUrl
    ? { datasource: { url: parseDatabaseTarget(databaseUrl).connectionString } }
    : {}),
});
