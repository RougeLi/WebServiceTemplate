import parser from '@typescript-eslint/parser';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import unicorn from 'eslint-plugin-unicorn';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    files: [
      'src/**/*.ts',
      'src/**/*.js',
      'test-utils/**/*.ts',
      'test-utils/**/*.js',
      'index.ts',
    ],
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.eslint.json',
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
