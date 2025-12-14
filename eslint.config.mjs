import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import perfectionist from 'eslint-plugin-perfectionist';
import tseslint from 'typescript-eslint';

import security from 'eslint-plugin-security';
import unicorn from 'eslint-plugin-unicorn';

import localRules from './eslint-local-rules/build/index.js';

export default tseslint.config(
  // 1. Core ESLint and TypeScript Recommended
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  // Add security recommended config here (good spot: after core but before styling/sorting)
  security.configs.recommended,
  unicorn.configs.recommended,

  // 2. Sorting (Perfectionist)
  perfectionist.configs['recommended-natural'],

  // 3. Formatting (Prettier - Must be last to disable conflicts)
  eslintConfigPrettier,

  // 4. Custom Configuration, Plugins, and Overrides
  {
    files: ['**/*.ts', '**/*.tsx'], // Target specific files for TypeScript-aware rules
    languageOptions: {
      parserOptions: {
        // Enables powerful, type-aware rules across the project
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      // Only declaring local-rules as other plugins are loaded via configs
      'local-rules': localRules,
    },
    rules: {
      // Conflicts: Ensure core sorting is off for perfectionist
      'sort-imports': 'off',

      // Stronger TypeScript enforcement
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', disallowTypeAnnotations: true },
      ],
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: false },
      ],
      '@typescript-eslint/no-explicit-any': 'error', // Ban any completely
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      // '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // Naming convention (excellent)
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: [
            'variable',
            'classProperty',
            'objectLiteralProperty',
            'typeProperty',
            'parameter',
          ],
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'should', 'has', 'can', 'did', 'will', 'was', 'are', 'does'],
        },
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
      ],

      // General Rules
      'no-console': ['error', { allow: ['warn', 'error'] }], // Stricter: ban debug logs

      // Unicorn Configuration - Disable overly aggressive rules
      'unicorn/prevent-abbreviations': 'off', // Too aggressive, conflicts with common naming patterns
      // Disable unicorn rules that conflict with our type-first standard
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'], // Enforce type over interface

      // Custom local rules
      'local-rules/destructuring-for-functions': 'warn',
      'local-rules/no-inline-type-imports': 'error',
      'local-rules/merge-duplicate-imports': 'error',
      'local-rules/type-suffix-naming': 'error',
    },
  },

  // 5. Ignores
  {
    ignores: [
      'build/',
      'out/',
      'dist/',
      'node_modules/',
      'eslint-local-rules/',
      '*.js',
      '*.mjs',
      'guidelines/playwright_config.ts',
      'scripts/',
    ],
  },
);
