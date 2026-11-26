import parser from '@typescript-eslint/parser';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import unicorn from 'eslint-plugin-unicorn';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    // Prisma Client output of `prisma generate`; not hand-written code.
    ignores: ['src/generated/**'],
  },
  {
    files: [
      'src/**/*.ts',
      'src/**/*.js',
      'test-utils/**/*.ts',
      'test-utils/**/*.js',
      'index.ts',
      'prisma.config.ts',
      'prisma/**/*.ts',
    ],
    languageOptions: {
      parser,
      parserOptions: {
        // The Prisma CLI config and seed are only in the spec type-check
        // project; they are not part of the build.
        project: ['./tsconfig.eslint.json', './tsconfig.typecheck-spec.json'],
      },
      ecmaVersion: 2024,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      unicorn,
      import: importPlugin,
    },
    rules: {
      'no-return-await': 'off',
      'unicorn/prefer-top-level-await': 'off',
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      'no-restricted-imports': [
        'error',
        {
          patterns: ['../../../*'],
        },
      ],
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          ignore: ['^\\d{13}-\\w+\\.ts$'],
        },
      ],
      'import/order': [
        'error',
        {
          groups: [['builtin', 'external', 'internal']],
          pathGroups: [
            {
              pattern: 'src/**',
              group: 'internal',
              position: 'after',
            },
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-unresolved': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
  },
  {
    files: ['*.spec.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'unicorn/prefer-module': 'off',
    },
  },
];
