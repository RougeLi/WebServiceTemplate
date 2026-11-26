import { EnvironmentSchema, transformEnvironment } from '../environment.schema';

const parse = (environment: Record<string, string>) =>
  transformEnvironment(EnvironmentSchema.parse(environment));

describe('EnvironmentSchema database pool settings', () => {
  it('should leave the pool settings unset so PrismaConfig applies its defaults', () => {
    const config = parse({});
    expect(config.databasePoolMax).toBeUndefined();
    expect(config.databaseConnectionTimeoutMs).toBeUndefined();
  });

  it('should parse positive integers', () => {
    const config = parse({
      DATABASE_POOL_MAX: '25',
      DATABASE_CONNECTION_TIMEOUT_MS: '2147483647',
    });
    expect(config.databasePoolMax).toBe(25);
    expect(config.databaseConnectionTimeoutMs).toBe(2147483647);
  });

  it.each(['0', '-1', '1.5', 'abc', '', ' 5', '010'])(
    'should reject DATABASE_POOL_MAX=%p',
    (value) => {
      expect(() => parse({ DATABASE_POOL_MAX: value })).toThrow();
    },
  );

  it.each(['0', '-1', '1.5', 'abc', '', '2147483648'])(
    'should reject DATABASE_CONNECTION_TIMEOUT_MS=%p',
    (value) => {
      expect(() => parse({ DATABASE_CONNECTION_TIMEOUT_MS: value })).toThrow();
    },
  );

  it('should not require DATABASE_URL', () => {
    expect(() => parse({})).not.toThrow();
    expect(
      Object.keys(parse({ DATABASE_URL: 'postgresql://app@db/app_db' })),
    ).not.toContain('databaseUrl');
  });
});
