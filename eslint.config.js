module.exports = [
  {
    files: [
      'src/**/*.ts',
      'src/**/*.js',
      'test-utils/**/*.ts',
      'test-utils/**/*.js',
      'index.ts',
    ],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
      ecmaVersion: 2024,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      unicorn: require('eslint-plugin-unicorn'),
      import: require('eslint-plugin-import'),
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
