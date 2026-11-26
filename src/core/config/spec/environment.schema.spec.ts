import { EnvironmentSchema, transformEnvironment } from '../environment.schema';

const parse = (environment: Record<string, string>) =>
  transformEnvironment(EnvironmentSchema.parse(environment));

describe('EnvironmentSchema PRISMA_QUERY_MAX_STR_LEN', () => {
  it('should leave the setting unset so the query formatter applies its default', () => {
    expect(parse({}).prismaQueryMaxStrLen).toBeUndefined();
  });

  it.each([
    ['1', 1],
    ['500', 500],
    ['9007199254740991', Number.MAX_SAFE_INTEGER],
  ])('should parse PRISMA_QUERY_MAX_STR_LEN=%p as %p', (value, expected) => {
    const config = parse({ PRISMA_QUERY_MAX_STR_LEN: value });
    expect(config.prismaQueryMaxStrLen).toBe(expected);
  });

  it.each([
    '0',
    '-1',
    '1.5',
    'abc',
    '',
    ' 5',
    '010',
    '1e3',
    '9007199254740992',
  ])('should reject PRISMA_QUERY_MAX_STR_LEN=%p', (value) => {
    expect(() => parse({ PRISMA_QUERY_MAX_STR_LEN: value })).toThrow();
  });
});
