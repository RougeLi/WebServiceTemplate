import { parseDatabaseUrl } from '../src/core/utils/db-utils';

/**
 * Seed entry point for `pnpm run prisma:seed` (`prisma db seed`).
 *
 * `prisma db seed` does not check the datasource URL, so the target database
 * is validated here before any work starts. This template ships no seed data.
 * If seeding later uses the Prisma Client, run `pnpm run prisma:generate`
 * first, import it from '../src/generated/prisma/client', create the Client
 * with a PrismaPg adapter, and call `$disconnect()` in a `finally` block.
 */
async function main(): Promise<void> {
  parseDatabaseUrl(process.env.DATABASE_URL);
}

main()
  .then(() => {
    console.log('Seeding completed.');
  })
  .catch((error: unknown) => {
    console.error(
      'Seeding failed:',
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  });
